using System.Xml.Linq;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

var config = new ConfigurationBuilder()
    .AddJsonFile("appsettings.Development.json")
    .Build();

var connectionString = config.GetConnectionString("DefaultConnection")!;
var nvidiaApiKey = config["Nvidia:ApiKey"]!;

var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseNpgsql(connectionString)
    .Options;

using var db = new AppDbContext(options);


Console.WriteLine("Parsing Kelly list...");

var kellyPath = args.ElementAtOrDefault(0) ?? "kelly.xml";
var xml = XDocument.Load(kellyPath);

var entries = xml.Descendants("LexicalEntry")
    .Select(e => new
    {
      Id = (int)e.Element("id")!,
      Word = e.Element("gf")?.Value.Trim() ?? "",
      Cefr = (int)e.Element("cefr")!,
      Pos = e.Element("pos")?.Value.Trim() ?? "",
      Wpm = double.Parse(
                     (e.Element("wpm")?.Value ?? "0").Replace(",", "."),
                     System.Globalization.CultureInfo.InvariantCulture),
      Source = e.Element("source")?.Value.Trim() ?? "",
    })
    .Where(e =>
        e.Cefr >= 3 &&
        !string.IsNullOrWhiteSpace(e.Word) &&
        e.Pos != "proper name" &&
        e.Pos != "numeral"
    )
    .ToList();

Console.WriteLine($"Found {entries.Count} B1-C2 words after filtering.");


static CefrLevel MapCefr(int cefr) => cefr switch
{
  3 => CefrLevel.B1,
  4 => CefrLevel.B2,
  5 => CefrLevel.C1,
  6 => CefrLevel.C2,
  _ => CefrLevel.B1
};


var httpClient = new HttpClient();
httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {nvidiaApiKey}");

int inserted = 0;
int skipped = 0;

foreach (var entry in entries)
{
  if (await db.Words.AnyAsync(w => w.Text == entry.Word))
  {
    skipped++;
    continue;
  }

  Console.Write($"Generating definition for '{entry.Word}'... ");

  string definition = "";
  int attempts = 0;

  while (attempts < 3)
  {
    try
    {
      definition = await GenerateDefinition(httpClient, entry.Word, entry.Pos);
      break;
    }
    catch (TaskCanceledException)
    {
      attempts++;
      Console.Write($"timeout, retrying ({attempts}/3)... ");
      await Task.Delay(2000);
    }
    catch (Exception ex)
    {
      Console.WriteLine($"error: {ex.Message}");
      break;
    }
  }

  definition = definition
      .Replace("**", "")
      .Replace("*", "")
      .Trim('"')
      .Trim('\'')
      .Trim();

  if (string.IsNullOrWhiteSpace(definition))
  {
    Console.WriteLine("skipped (no definition returned)");
    continue;
  }

  var word = new Word
  {
    Id = Guid.NewGuid(),
    Text = entry.Word,
    Definition = definition,
    IsReviewed = false,
    PartOfSpeech = entry.Pos,
    DifficultyLevel = MapCefr(entry.Cefr),
    FrequencyRank = entry.Wpm,
    Source = entry.Source,
  };

  db.Words.Add(word);
  await db.SaveChangesAsync();

  inserted++;
  Console.WriteLine($"done ({MapCefr(entry.Cefr)})");

  await Task.Delay(400);
}

Console.WriteLine($"\nSeeding complete. Inserted: {inserted}, Skipped: {skipped}");


static async Task<string> GenerateDefinition(HttpClient client, string word, string pos)
{
  var prompt = $"""
    Skriv en kort och tydlig definition på svenska av ordet "{word}" ({pos}).
    Definitionen ska vara på svenska, i en mening, och passar för en avancerad inlärare (B1-C2).
    
    Regler:
    - Svara ENDAST med definitionen, inget annat
    - Inga citattecken runt definitionen
    - Ingen fetstil eller markdown-formatering
    - Inga specialtecken
    - Börja inte med ordet själv
    - En enda mening, avsluta med punkt
    """;

  var body = new
  {
    model = "mistralai/mistral-medium-3.5-128b",
    messages = new[]
      {
          new { role = "system", content = "Du är en expert på svenska språket och skriver korrekta, välformulerade definitioner på svenska. Du behärskar svensk grammatik perfekt, inklusive genus och adjektivkongruens." },
          new { role = "user", content = prompt }
      },
    max_tokens = 128
  };

  var response = await client.PostAsJsonAsync(
      "https://integrate.api.nvidia.com/v1/chat/completions", body);

  if (!response.IsSuccessStatusCode)
  {
    var errorBody = await response.Content.ReadAsStringAsync();
    Console.WriteLine($"API error: {response.StatusCode} - {errorBody}");
    return "";
  }

  var json = await response.Content.ReadFromJsonAsync<NvidiaResponse>();
  return json?.Choices?.FirstOrDefault()?.Message?.Content?.Trim() ?? "";
}


record NvidiaResponse(NvidiaChoice[]? Choices);
record NvidiaChoice(NvidiaMessage? Message);
record NvidiaMessage(string? Content);