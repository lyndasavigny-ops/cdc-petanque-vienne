"use client";

export default function GuideTab() {
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            📖 Guide &amp; résumé complet
          </h2>
          <p className="text-sm text-slate-500">
            Tout le récapitulatif du système — imprimez-le en PDF.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          🖨️ Imprimer / PDF
        </button>
      </div>

      <div id="guide-print" className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6">
        {/* En-tête */}
        <div className="border-b-2 border-slate-800 pb-3 text-center">
          <h1 className="text-2xl font-black uppercase text-blue-800">
            Championnats Des Clubs — Pétanque
          </h1>
          <p className="text-sm text-slate-600">
            Comité départemental de la Vienne (86) · FFPJP
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Guide &amp; résumé du système de gestion des championnats
          </p>
          <p className="mt-2 inline-block rounded-full bg-blue-800 px-3 py-1 text-xs font-bold text-white">
            Version 12
          </p>
        </div>

        {/* Présentation */}
        <section>
          <h2 className="mb-2 text-lg font-bold text-blue-800">
            🎯 Présentation
          </h2>
          <p className="text-sm text-slate-700">
            Application en ligne pour gérer les championnats de pétanque :
            création des poules, tirage au sort, saisie des scores par les clubs,
            <strong> classement en direct</strong>, feuilles de match imprimables
            et partage des accès par SMS. Tous les clubs voient les résultats en
            temps réel.
          </p>
        </section>

        {/* Accès */}
        <section>
          <h2 className="mb-2 text-lg font-bold text-blue-800">🔑 Les accès</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-2 py-1 text-left">Rôle</th>
                <th className="border border-slate-300 px-2 py-1 text-left">Accès</th>
                <th className="border border-slate-300 px-2 py-1 text-left">Ce qu&apos;il peut faire</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 px-2 py-1 font-semibold">
                  👑 Administrateur
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  <code>admin</code> / <code>vienne86</code>
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  Tout : création, tirage, feuilles, saisie, classement,
                  distribution, déverrouillage.
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1 font-semibold">
                  🏅 Club organisateur
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  Lien / code <code>ORG-…</code>
                </td>
                <td className="border border-slate-300 px-2 py-1">
                  Remplit les scores de <strong>ses propres matchs</strong>
                  uniquement, puis valide (verrouille).
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1 font-semibold">
                  👁 Public
                </td>
                <td className="border border-slate-300 px-2 py-1">Aucun</td>
                <td className="border border-slate-300 px-2 py-1">
                  Voit les résultats et le classement en lecture seule.
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Mode d'emploi */}
        <section>
          <h2 className="mb-2 text-lg font-bold text-blue-800">
            📋 Mode d&apos;emploi (en 7 étapes)
          </h2>
          <ol className="grid gap-2 text-sm text-slate-700">
            <li className="rounded bg-slate-50 p-2">
              <strong>1. Créer un championnat</strong> — saison, type
              (Senior/Vétéran/Féminin), division (CDC 1-4), poule (A-H), format
              (Doublettes 3×12 pts / Triplettes 2×18 pts).
            </li>
            <li className="rounded bg-slate-50 p-2">
              <strong>2. Équipes &amp; tirage</strong> — saisissez les équipes puis
              « Lancer le tirage » (chaque équipe rencontre toutes les autres).
            </li>
            <li className="rounded bg-slate-50 p-2">
              <strong>3. Dates &amp; lieux</strong> — renseignez chaque journée
              (lieu, date, heure).
            </li>
            <li className="rounded bg-slate-50 p-2">
              <strong>4. Partager</strong> — onglet Distribution : envoyez aux
              clubs leur lien par SMS (identifiant + mot de passe inclus).
            </li>
            <li className="rounded bg-slate-50 p-2">
              <strong>5. Saisie</strong> — chaque club remplit les scores de ses
              matchs (36 points, forfaits). Sauvegarde automatique.
            </li>
            <li className="rounded bg-slate-50 p-2">
              <strong>6. Validation</strong> — le club clique « Valider la
              journée » → confirme → 🔒 verrouillé (l&apos;admin seul peut
              modifier).
            </li>
            <li className="rounded bg-slate-50 p-2">
              <strong>7. Classement &amp; feuilles</strong> — classement selon
              l&apos;<strong>article 12</strong> : 1) points (V/N/D/F modifiables),
              2) égalité → confrontation directe ou mini-championnat, 3) point
              average. <strong>Forfait = 19 à 0</strong>. Feuilles de match et
              feuille de résultats imprimables.
            </li>
          </ol>
        </section>

        {/* Feuilles de match */}
        <section>
          <h2 className="mb-2 text-lg font-bold text-blue-800">
            📄 Feuilles de match
          </h2>
          <ul className="list-inside list-disc text-sm text-slate-700">
            <li>
              <strong>Feuille 1</strong> : composition des équipes (8 joueurs,
              n° de licence), capitaines, réserve, signatures.
            </li>
            <li>
              <strong>Feuille 2</strong> : ordre des rencontres et feuille de
              résultats (scores groupés par partie).
            </li>
            <li>
              Logos officiels (FFPJP France, Vienne, Nouvelle-Aquitaine)
              intégrés en vectoriel → nets à l&apos;impression.
            </li>
            <li>
              Impression <strong>recto/verso</strong> (format A4), une rencontre
              sur 2 pages.
            </li>
          </ul>
        </section>

        {/* Règles de classement */}
        <section>
          <h2 className="mb-2 text-lg font-bold text-blue-800">
            🏆 Règles de classement (article 12)
          </h2>
          <ul className="list-inside list-disc text-sm text-slate-700">
            <li>
              <strong>Barème modifiable</strong> : victoire / nul / défaite /
              forfait (défaut 3 · 2 · 1 · 0).
            </li>
            <li>
              <strong>Critère 1</strong> : total des points.
            </li>
            <li>
              <strong>Critère 2 (égalité)</strong> : entre 2 équipes → résultat
              de l&apos;opposition directe ; entre 3 ou plus →{" "}
              <strong>mini-championnat</strong> (résultats des matchs entre
              elles).
            </li>
            <li>
              <strong>Critère 3</strong> : point average général (différence
              Pour − Contre).
            </li>
            <li>
              <strong>Forfait</strong> : l&apos;équipe vainqueur l&apos;emporte{" "}
              <strong>19 à 0</strong> (3 points, différence +19).
            </li>
            <li>
              <strong>Classement final (admin)</strong> : colonne pour ajuster
              l&apos;ordre en cas d&apos;égalité (tapez les places 1 à 8).
            </li>
          </ul>
        </section>

        {/* Sécurité */}
        <section>
          <h2 className="mb-2 text-lg font-bold text-blue-800">🔒 Sécurité</h2>
          <ul className="list-inside list-disc text-sm text-slate-700">
            <li>
              Accès par <strong>codes uniques</strong> (admin / clubs), insensibles
              à la casse.
            </li>
            <li>
              Chaque club ne voit et ne remplit que <strong>ses propres matchs</strong>.
            </li>
            <li>
              <strong>Verrouillage</strong> après validation : le club ne peut plus
              modifier, seul l&apos;admin peut déverrouiller.
            </li>
            <li>Codes masqués au public.</li>
            <li>
              <strong>Seul le compte admin</strong> peut créer ou supprimer des
              utilisateurs.
            </li>
          </ul>
        </section>

        {/* Utilisateurs */}
        <section>
          <h2 className="mb-2 text-lg font-bold text-blue-800">
            👥 Ajouter des utilisateurs
          </h2>
          <ul className="list-inside list-disc text-sm text-slate-700">
            <li>
              L&apos;administrateur peut ajouter des{" "}
              <strong>adjoints / co-gérants</strong> : onglet{" "}
              <strong>« 📤 Distribution / SMS »</strong> → « 👥 Ajouter un
              utilisateur ».
            </li>
            <li>
              Chaque utilisateur ajouté se connecte avec{" "}
              <strong>son propre identifiant</strong> et mot de passe.
            </li>
            <li>
              <strong>Seul votre compte admin maître</strong> peut créer des
              comptes — les utilisateurs ajoutés ne le peuvent pas.
            </li>
          </ul>
        </section>

        {/* Sauvegarde */}
        <section>
          <h2 className="mb-2 text-lg font-bold text-blue-800">💾 Sauvegarde</h2>
          <ul className="list-inside list-disc text-sm text-slate-700">
            <li>Classement (CSV), Scores (CSV), Sauvegarde complète (JSON).</li>
            <li>Feuilles en PDF (Imprimer).</li>
            <li>
              Conservez vos exports après chaque journée — vos données sont
              toujours en sécurité.
            </li>
          </ul>
        </section>

        {/* Rappel */}
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <h2 className="mb-1 font-bold text-blue-800">📌 Rappel des identifiants</h2>
          <p className="text-sm text-blue-900 print:hidden">
            Administrateur : <code>admin</code> / <code>vienne86</code> ·
            Clubs : leur lien <code>ORG-… / CLB-…</code> (onglet Distribution).
          </p>
          <p className="hidden text-sm text-blue-900 print:block">
            Identifiants masqués à l&apos;impression (sécurité) — visibles
            uniquement dans l&apos;application pour les personnes autorisées.
          </p>
        </section>

        <p className="border-t border-slate-200 pt-3 text-center text-xs text-slate-500">
          Comité de la Vienne · 1 Rue de la Poste, 86500 Saint Julien l&apos;Ars
        </p>
      </div>
    </div>
  );
}
