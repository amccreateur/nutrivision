import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { MealHistoryItem, UserPreferences } from '../types/nutrition';

export async function generateAndSharePdfReport(
  history: MealHistoryItem[],
  preferences: UserPreferences,
  waterTotalMl: number = 0
): Promise<void> {
  const totalCalories = history.reduce((sum, item) => sum + item.calories, 0);
  const avgCalories = history.length > 0 ? Math.round(totalCalories / Math.max(1, new Set(history.map(m => new Date(m.timestamp).toDateString())).size)) : 0;
  
  const gradeCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  history.forEach(item => {
    if (gradeCounts[item.nutriScore] !== undefined) {
      gradeCounts[item.nutriScore]++;
    }
  });

  const rowsHtml = history.slice(0, 30).map((meal) => {
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
        <title>Rapport Nutritionnel NutriVision</title>
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
            font-size: 26px;
            font-weight: 800;
            color: #0F172A;
            margin: 0;
          }
          .subtitle {
            font-size: 13px;
            color: #64748B;
            margin-top: 4px;
          }
          .summary-cards {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
          }
          .card {
            flex: 1;
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 15px;
            text-align: center;
          }
          .card-value {
            font-size: 22px;
            font-weight: 800;
            color: #10B981;
          }
          .card-label {
            font-size: 12px;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #F1F5F9;
            color: #475569;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 8px;
            text-align: left;
          }
          .footer {
            margin-top: 40px;
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
        </div>

        <div class="summary-cards">
          <div class="card">
            <div class="card-value">${history.length}</div>
            <div class="card-label">Repas Scannés</div>
          </div>
          <div class="card">
            <div class="card-value">${avgCalories} kcal</div>
            <div class="card-label">Moyenne / Jour</div>
          </div>
          <div class="card">
            <div class="card-value">${waterTotalMl} ml</div>
            <div class="card-label">Hydratation du Jour</div>
          </div>
          <div class="card">
            <div class="card-value" style="color: #038141;">A (${gradeCounts.A}) / B (${gradeCounts.B})</div>
            <div class="card-label">Nutri-Score Verts</div>
          </div>
        </div>

        <h3 style="margin-bottom: 10px; font-size: 16px; color: #1E293B;">Historique détaillé des repas récents</h3>
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
            ${rowsHtml || '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #94A3B8;">Aucun repas enregistré</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Rapport généré automatiquement par NutriVision. Ce document est fourni à titre indicatif pour accompagner vos suivis médicaux et diététiques.
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Partager votre rapport nutritionnel NutriVision',
      });
    }
  } catch (error) {
    console.warn('Erreur lors de la génération du PDF :', error);
    throw error;
  }
}

