// ============================================================
//  Acelera Pedra Branca — Sync automático Google Sheets → Site
//  Cole este código em: Extensões > Apps Script
// ============================================================

// PREENCHA AQUI:
var BACKEND_URL = 'https://acelera-pedra-branca.onrender.com/api/sheets/sync';
var ADMIN_TOKEN = '7f41248d5918daf19119630f99d87dddbbf22653f9c3df68682da33050e41eb5';

// Nome da aba da planilha onde ficam os dados das empresas
var SHEET_NAME = 'Página1';

// ── Trigger automático ao editar ─────────────────────────────
// NÃO use o nome "onEdit" aqui: esse nome é um "trigger simples" do
// Google e roda com permissão limitada, sem poder chamar UrlFetchApp
// (dá erro de permissão sozinho). Esta função é ligada como um
// "trigger instalável" (menu Triggers ⏰ no editor do Apps Script),
// que roda com permissão completa. O nome bate com o acionador que
// já existe na planilha — não precisa reconfigurar nada.
function onEditSync(e) {
  var sheet = e.source.getActiveSheet();
  if (sheet.getName() !== SHEET_NAME) return;

  // Ignora edição no cabeçalho ou na linha de pesos
  var row = e.range.getRow();
  if (row < 2) return;

  syncToSite();
}

// ── Lê a planilha e envia para o backend ─────────────────────
function syncToSite() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Aba "' + SHEET_NAME + '" não encontrada.', 'Erro', 5);
    return;
  }

  var data = sheet.getDataRange().getValues();
  var startups = [];

  // Estrutura esperada das colunas (igual ao PDF):
  // A=Empresas, B=Aulas, C=Mentoria, D=Canvas, E=Entrevistas,
  // F=MVP, G=Pessoas testando, H=Clientes pagantes,
  // I=Estagio inicial, J=Estagio atual, K=Faltas mentoria (-5 pts cada)

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var nome = String(row[0] || '').trim();

    // Pula linhas vazias, "pontos totais" e "Pesos"
    if (!nome) continue;
    if (nome.toLowerCase().indexOf('pontos') !== -1) continue;
    if (nome.toLowerCase().indexOf('pesos') !== -1) continue;

    startups.push({
      nome:              nome,
      aulas:             row[1],
      mentoria:          row[2],
      canvas_feito:      row[3],
      entrevistas:       row[4],
      mvp_funcional:     row[5],
      pessoas_testando:  row[6],
      clientes_pagantes: row[7],
      estagio_atual:     row[9],
      faltas_mentoria:   row[10],
    });
  }

  if (startups.length === 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Nenhuma empresa encontrada na planilha.', 'Aviso', 4);
    return;
  }

  try {
    var response = UrlFetchApp.fetch(BACKEND_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + ADMIN_TOKEN },
      payload: JSON.stringify({ startups: startups }),
      muteHttpExceptions: true,
    });

    var result = JSON.parse(response.getContentText());

    if (result.error) {
      SpreadsheetApp.getActiveSpreadsheet().toast('Erro: ' + result.error, 'Falha no sync', 6);
      return;
    }

    var msg = result.synced.length + ' empresa(s) sincronizada(s).';
    if (result.unmatched && result.unmatched.length > 0) {
      msg += ' Não encontradas: ' + result.unmatched.join(', ');
    }
    if (result.errors && result.errors.length > 0) {
      msg += ' Erros: ' + result.errors.map(function(e) { return e.nome; }).join(', ');
    }

    var title = result.unmatched.length === 0 && result.errors.length === 0
      ? 'Sync concluído ✓'
      : 'Sync parcial ⚠';

    SpreadsheetApp.getActiveSpreadsheet().toast(msg, title, 5);

  } catch (err) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Erro de conexão: ' + err.message, 'Falha', 6);
  }
}

// ── Botão manual (opcional) ───────────────────────────────────
// Você pode criar um botão na planilha e vincular esta função:
function syncManual() {
  syncToSite();
}
