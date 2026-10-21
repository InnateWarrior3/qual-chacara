// Cole este código em Extensões > Apps Script da sua Planilha Google
// e publique como "App da Web" (veja LEIAME.md).
// Cada voto vira uma linha: quando | nome | 1º | 2º | 3º | 4º | 5º | comentário

const IDS = ["c1", "c2", "c3", "c4", "c5"];

function aba_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(["quando", "nome", "1º", "2º", "3º", "4º", "5º", "comentário"]);
  return sh;
}

function resposta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const v = JSON.parse(e.postData.contents);
    const nome = String(v.nome || "").trim().slice(0, 40);
    const ranking = Array.isArray(v.ranking) ? v.ranking.map(String) : [];
    const valido = nome && ranking.length === IDS.length && IDS.every((id) => ranking.indexOf(id) >= 0);
    if (!valido) return resposta_({ ok: false, erro: "voto inválido" });
    aba_().appendRow([new Date().toISOString(), nome].concat(ranking, [String(v.obs || "").slice(0, 280)]));
    return resposta_({ ok: true });
  } catch (err) {
    return resposta_({ ok: false, erro: String(err) });
  }
}

function doGet() {
  const linhas = aba_().getDataRange().getValues().slice(1);
  const votos = linhas.map((l) => ({ quando: String(l[0]), nome: String(l[1]), ranking: l.slice(2, 7).map(String), obs: String(l[7] || "") }));
  return resposta_({ votos: votos });
}
