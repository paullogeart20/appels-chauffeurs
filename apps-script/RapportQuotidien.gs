// ===== Rapport quotidien Appels Chauffeurs — envoi email auto =====
//
// COPIE DE RÉFÉRENCE (versionnée). Le code qui tourne réellement vit dans le
// projet Google Apps Script lié au Google Sheet (ID 132cw_7ipnTTD-cj2lada1FNLKUfPJu0a-e8pTXVhRf0).
// Si tu modifies ce fichier, reporte le changement dans l'éditeur Apps Script
// (Extensions → Apps Script depuis le Sheet), et inversement.
//
// Principe : la fonction relit les données via l'URL publique de l'Apps Script
// (UrlFetchApp, qui tourne sur l'infra Google — pas de blocage réseau), pour
// utiliser EXACTEMENT le même mapping de colonnes que le dashboard, puis envoie
// un vrai email via MailApp. Un déclencheur horaire l'exécute chaque jour à 18h.
//
// Mise en place :
//   1. Paramètres du projet → Fuseau horaire = (GMT+00:00) Abidjan (= UTC, comme les dates stockées).
//   2. Exécuter `sendDailyReport` une fois (autoriser les permissions) → email de test immédiat.
//   3. Exécuter `creerDeclencheur18h` une fois → programme l'envoi quotidien à 18h.

const RAPPORT_EMAIL = 'paul.logeart@fleetch.net';
const RAPPORT_EXEC_URL = 'https://script.google.com/macros/s/AKfycbwZePDKjBd1ALG9vhGPgvtfZe2uio7S5uqbyKfSYdJHLMkIqUuBGUQSeP4cMYB-Xfjn/exec';

function _S(s){ return s == null ? '' : String(s); }
function _has(s, x){ return _S(s).indexOf(x) >= 0; }

function sendDailyReport() {
  let drivers = [], resp = [];
  try {
    drivers = (JSON.parse(UrlFetchApp.fetch(RAPPORT_EXEC_URL, {muteHttpExceptions:true}).getContentText()).drivers) || [];
    resp    = (JSON.parse(UrlFetchApp.fetch(RAPPORT_EXEC_URL + '?sheet=responses', {muteHttpExceptions:true}).getContentText()).responses) || [];
  } catch (e) {
    MailApp.sendEmail({to: RAPPORT_EMAIL, subject: '⚠️ Rapport Appels Chauffeurs — échec', htmlBody: 'Erreur de lecture des données : ' + e});
    return;
  }
  drivers = drivers.filter(d => d.nom && d.nom !== 'NaN' && d.nom !== '-' && String(d.nom).trim() !== '');

  // Date du jour (UTC, pour coller au format stocké dans le Sheet)
  const now = new Date();
  const jours = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  const mois  = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const today = Utilities.formatDate(now, 'Etc/GMT', 'yyyy-MM-dd');
  const dateFr = jours[now.getUTCDay()] + ' ' + now.getUTCDate() + ' ' + mois[now.getUTCMonth()] + ' ' + now.getUTCFullYear();

  // ── Cumul ──
  const tot     = drivers.length;
  const doneTot = drivers.filter(d => _has(d.statut,'soumis')).length;
  const reste   = drivers.filter(d => _has(d.statut,'À appeler')).length;
  const rappel  = drivers.filter(d => _has(d.statut,'Rappeler')).length;
  const inj     = drivers.filter(d => _has(d.statut,'Injoignable')).length;

  // ── Aujourd'hui ──
  let appelsTot = 0, appelsToday = 0, soumisToday = 0;
  const perAgentToday = {}, perAgentRespToday = {};
  drivers.forEach(d => {
    [[d.d1,d.r1],[d.d2,d.r2],[d.d3,d.r3]].forEach(pair => {
      const dt = pair[0], r = pair[1];
      if (!r) return;
      appelsTot++;
      if (_S(dt).slice(0,10) === today) {
        appelsToday++;
        const ag  = (r.split(' — ')[1] || '(non tracé)').trim();
        const res = (r.split(' — ')[0] || '').trim();
        perAgentToday[ag] = (perAgentToday[ag] || 0) + 1;
        if (res === 'Répondu') { perAgentRespToday[ag] = (perAgentRespToday[ag] || 0) + 1; soumisToday++; }
      }
    });
  });
  const agentsRows = Object.keys(perAgentToday).length
    ? Object.keys(perAgentToday).sort((a,b) => perAgentToday[b]-perAgentToday[a])
        .map(a => `<li>${a} : <b>${perAgentToday[a]}</b> appels (${perAgentRespToday[a]||0} répondus)</li>`).join('')
    : '<li>Aucun appel tracé aujourd\'hui</li>';

  // ── Résultats questionnaire (cumul) ──
  const n = resp.length;
  const notes = resp.map(r => parseFloat(r.q1)).filter(v => !isNaN(v));
  const avg = notes.length ? (notes.reduce((a,b) => a+b, 0)/notes.length).toFixed(1) : '—';
  const pc = x => n ? Math.round(x/n*100) + '%' : '—';
  const heur     = resp.filter(r => _has(r.q7,'10h et 12h') || _has(r.q7,'Plus de 12h')).length;
  const churn    = resp.filter(r => _has(r.q12,'Je sais pas') || _has(r.q12,'Non je pense')).length;
  const yangoOk  = resp.filter(r => _S(r.q9) === 'Non').length;
  const garageBad= resp.filter(r => _has(r.q18,'Peu') || _has(r.q18,'Pas du tout')).length;
  const garageOk = resp.filter(r => _has(r.q18,'Très') || _S(r.q18) === 'Satisfait').length;

  const pctDone = tot ? Math.round(doneTot/tot*100) : 0;

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1a1d2e;max-width:560px">
      <h2 style="margin:0 0 4px">📞 Rapport Appels Chauffeurs</h2>
      <div style="color:#8892aa;margin-bottom:16px">${dateFr}</div>

      <h3 style="border-bottom:1px solid #eee;padding-bottom:4px">— Aujourd'hui —</h3>
      <p>Appels passés : <b>${appelsToday}</b></p>
      <ul>${agentsRows}</ul>
      <p>Questionnaires soumis : <b>${soumisToday}</b></p>

      <h3 style="border-bottom:1px solid #eee;padding-bottom:4px">— Cumul depuis le début —</h3>
      <ul>
        <li>Questionnaires soumis : <b>${doneTot}</b> / ${tot} (${pctDone}%)</li>
        <li>Reste à appeler : <b>${reste}</b></li>
        <li>À rappeler : ${rappel} · Injoignables : ${inj}</li>
        <li>Total appels passés : ${appelsTot}</li>
      </ul>

      <h3 style="border-bottom:1px solid #eee;padding-bottom:4px">— Résultats questionnaire (${n} réponses) —</h3>
      <ul>
        <li>Note globale moyenne : <b>${avg}/10</b></li>
        <li>Roulent +10h/jour : ${heur} (${pc(heur)})</li>
        <li>Exclusivité Yango OK (« Non ») : ${yangoOk} (${pc(yangoOk)})</li>
        <li>Risque de départ (Q12) : ${churn} (${pc(churn)})</li>
        <li>Garage satisfait/très : ${garageOk} (${pc(garageOk)}) · insatisfait : ${garageBad} (${pc(garageBad)})</li>
      </ul>
    </div>`;

  MailApp.sendEmail({
    to: RAPPORT_EMAIL,
    subject: `📞 Rapport Appels Chauffeurs — ${dateFr}`,
    htmlBody: html
  });
}

// À lancer UNE SEULE FOIS pour programmer l'envoi quotidien à 18h
function creerDeclencheur18h() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'sendDailyReport') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendDailyReport').timeBased().everyDays(1).atHour(18).create();
}
