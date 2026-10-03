import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { MealHistoryItem, UserPreferences } from '../types/nutrition';

export type ReportPeriod = 'today' | '7days' | '30days' | 'all';

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  today: 'Aujourd’hui',
  '7days': '7 derniers jours (Semaine)',
  '30days': '30 derniers jours (Mois)',
  all: 'Historique complet',
};

export async function generateAndSharePdfReport(
  history: MealHistoryItem[],
  preferences: UserPreferences,
  waterTotalMl: number = 0,
  period: ReportPeriod = '7days'
): Promise<void> {
  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);

  // Filtrage des repas selon la période sélectionnée
  let filteredHistory = history;
  if (period === 'today') {
    filteredHistory = history.filter((m) => m.timestamp >= todayStart);
  } else if (period === '7days') {
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    filteredHistory = history.filter((m) => m.timestamp >= sevenDaysAgo);
  } else if (period === '30days') {
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    filteredHistory = history.filter((m) => m.timestamp >= thirtyDaysAgo);
  }

  const uniqueDays = Math.max(1, new Set(filteredHistory.map((m) => new Date(m.timestamp).toDateString())).size);
  const totalCalories = filteredHistory.reduce((sum, item) => sum + item.calories, 0);
  const avgCalories = filteredHistory.length > 0 ? Math.round(totalCalories / uniqueDays) : 0;

  const gradeCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  filteredHistory.forEach((item) => {
    if (gradeCounts[item.nutriScore] !== undefined) {
      gradeCounts[item.nutriScore]++;
    }
  });

  const profileInfo = preferences.userProfile
    ? `${preferences.userProfile.gender === 'male' ? 'Homme' : 'Femme'}, ${preferences.userProfile.age} ans, ${preferences.userProfile.weightKg} kg, ${preferences.userProfile.heightCm} cm (${preferences.userProfile.goal === 'lose_weight' ? 'Perte de poids' : preferences.userProfile.goal === 'gain_muscle' ? 'Prise de masse' : 'Maintien'})`
    : 'Objectif standard';

  const rowsHtml = filteredHistory.map((meal) => {
    const dateStr = new Date(meal.timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    const gradeColor =
      meal.nutriScore === 'A'
        ? '#038141'
        : meal.nutriScore === 'B'
        ? '#85BB2F'
        : meal.nutriScore === 'C'
        ? '#FECB02'
        : meal.nutriScore === 'D'
        ? '#EE8100'
        : '#E63E11';

    return `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 10px 8px; font-size: 13px; color: #64748B;">${dateStr}</td>
        <td style="padding: 10px 8px; font-size: 14px; font-weight: 600; color: #1E293B;">${meal.dishName}</td>
        <td style="padding: 10px 8px; font-size: 13px; color: #0F172A;">${meal.portionGrams}g</td>
        <td style="padding: 10px 8px; font-size: 14px; font-weight: 700; color: #059669;">${meal.calories} kcal</td>
        <td style="padding: 10px 8px; text-align: center;">
          <span style="background-color: ${gradeColor}; color: white; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 13px;">
            ${meal.nutriScore}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Rapport Nutritionnel NutriVision — ${PERIOD_LABELS[period]}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0F172A;
            margin: 0;
            padding: 30px;
            background-color: #FFFFFF;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #10B981;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .title {
            font-size: 24px;
            font-weight: 800;
            color: #0F172A;
            margin: 0;
          }
          .subtitle {
            font-size: 13px;
            color: #64748B;
            margin-top: 4px;
          }
          .period-badge {
            background-color: #ECFDF5;
            color: #059669;
            border: 1px solid #A7F3D0;
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 13px;
          }
          .profile-banner {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 10px;
            padding: 10px 16px;
            margin-bottom: 20px;
            font-size: 13px;
            color: #334155;
          }
          .summary-cards {
            display: flex;
            gap: 12px;
            margin-bottom: 25px;
          }
          .card {
            flex: 1;
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 14px;
            text-align: center;
          }
          .card-value {
            font-size: 20px;
            font-weight: 800;
            color: #10B981;
          }
          .card-label {
            font-size: 11px;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th {
            background-color: #F1F5F9;
            color: #475569;
            font-size: 12px;
            text-transform: uppercase;
            padding: 10px 8px;
            text-align: left;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 11px;
            color: #94A3B8;
            border-top: 1px solid #E2E8F0;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">🥗 NutriVision — Rapport Nutritionnel</h1>
            <div class="subtitle">Généré le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <div class="period-badge">📅 ${PERIOD_LABELS[period]}</div>
        </div>

        <div class="profile-banner">
          <strong>Profil utilisateur :</strong> ${profileInfo} • <strong>Objectif cible :</strong> ${preferences.dailyCalorieTarget || 2000} kcal/jour
        </div>

        <div class="summary-cards">
          <div class="card">
            <div class="card-value">${filteredHistory.length}</div>
            <div class="card-label">Repas sur la période</div>
          </div>
          <div class="card">
            <div class="card-value">${avgCalories} / ${preferences.dailyCalorieTarget || 2000} kcal</div>
            <div class="card-label">Moyenne vs Cible</div>
          </div>
          <div class="card">
            <div class="card-value">${waterTotalMl} / ${preferences.dailyWaterTargetMl || 2000} ml</div>
            <div class="card-label">Hydratation (Aujourd'hui)</div>
          </div>
          <div class="card">
            <div class="card-value" style="color: #038141;">A (${gradeCounts.A}) / B (${gradeCounts.B})</div>
            <div class="card-label">Nutri-Score Verts</div>
          </div>
        </div>

        <h3 style="margin-bottom: 10px; font-size: 16px; color: #1E293B;">Historique des repas (${PERIOD_LABELS[period]})</h3>
        <table>
          <thead>
            <tr>
              <th>Date & Heure</th>
              <th>Plat / Aliment</th>
              <th>Portion</th>
              <th>Énergie</th>
              <th style="text-align: center;">Nutri-Score</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #94A3B8;">Aucun repas enregistré sur cette période</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Rapport généré automatiquement par NutriVision. Ce document est fourni à titre indicatif pour accompagner vos suivis de santé et vos consultations diététiques.
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html: htmlContent });
  await Sharing.shareAsync(uri, {
    UTI: '.pdf',
    mimeType: 'application/pdf',
    dialogTitle: `Partager mon rapport nutritionnel (${PERIOD_LABELS[period]})`,
  });
}
