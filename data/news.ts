export type LocalizedText = {
  fr: string;
  en: string;
  jp: string;
};

export type NewsEntry = {
  id: string;
  title: LocalizedText;
  body?: LocalizedText;
  date: string; // ISO date (YYYY-MM-DD)
};

export const NEWS: NewsEntry[] = [
  {
    id: 'v2026.01.04',
    title: {
      fr: 'Notes de mise à jour du 04/01/2026',
      en: 'Release Notes of 04/01/2026',
      jp: 'リリースノート 2026/01/04',
    },
    body: {
      fr:
        "Merci d'utiliser GachaNote — nous continuons de travailler pour ajouter des fonctionnalités utiles et améliorer votre expérience.\n\n" +
        "Ajout d’une page Wishlist\n\n" +
        "Ajout de la fonctionnalité Wishlist pour sauvegarder les personnages que vous souhaitez obtenir à l'avenir.",
      en:
        "Thank you for using GachaNote — we keep working to add useful features and improve your experience.\n\n" +
        "Added a Wishlist page\n\n" +
        "Added Wishlist functionality to save the characters you want to get in the future.",
      jp:
        "GachaNoteをご利用いただきありがとうございます。より便利な機能を追加し、体験を改善するために継続的に取り組んでいます。\n\n" +
        "Wishlistページを追加しました。\n\n" +
        "将来入手したいキャラクターを保存するWishlist機能を追加しました。",
    },
    date: '2026-01-04',
  },

  {
    id: 'v1.0.0',
    title: {
      fr: 'Notes de mise à jour du 09/12/2025',
      en: 'Release Notes of 12/09/2025',
      jp: 'リリースノート 2025/12/09',
    },
    body: {
      fr:
        "Merci d'utiliser GachaNote — nous continuons de travailler pour ajouter des fonctionnalités utiles et améliorer votre expérience.\n\n" +
        "Ajout du serveur Gacha : Vous pouvez désormais ajouter et différencier vos ajouts en fonction du serveur choisi.\n\n" +
        "Correction : la virgule se comporte maintenant comme un point pour les nombres\n\n" +
        "Ajout d’un filtre par date dans les statistiques du Gacha",
      en:
        "Thank you for using GachaNote — we keep working to add useful features and improve your experience.\n\n" +
        "Added Gacha server: You can now add and differentiate your entries based on the chosen server.\n\n" +
        "Fix: comma now behaves like a dot for numeric input\n\n" +
        "Added date filter to Gacha statistics",
      jp:
        "GachaNoteをご利用いただきありがとうございます。より便利な機能を追加し、体験を改善するために継続的に取り組んでいます。\n\n" +
        "ガチャサーバーを追加しました：選択したサーバーに基づいてエントリを追加および区別できるようになりました。\n\n" +
        "修正：数字入力でカンマがドットのように扱われるようになりました。\n\n" +
        "ガチャ統計に日付フィルターを追加しました。",
    },
    date: '2025-12-09',
  },

  {
    id: '0.9.9',
    title: {
      fr: 'Notes de mise à jour du 24/11/2025',
      en: 'Release Notes of 11/24/2025',
      jp: 'リリースノート 2025/11/24',
    },
    body: {
      fr:
        "Merci d'utiliser GachaNote. Nous travaillons constamment pour ajouter des fonctionnalités utiles et améliorer l'application pour vous.\n\n" +
        "- Mise à jour de la version interne de l'application\n" +
        "- Amélioration du système de feedback et rendu plus flexible\n" +
        "- Ajout du label « Featured » dans la bannière\n" +
        "- Affichage du taux de drop pour le prochain tirage\n" +
        "- Meilleure persistance du mode « favoris uniquement »\n" +
        "- Ajout de restrictions pour l'envoi de feedback",
      en:
        "Thank you for using GachaNote. We continuously work to add helpful features and improve the app for you.\n\n" +
        "- Updated internal app version\n" +
        "- Improved feedback system and added flexibility\n" +
        "- Added “Featured” label in the banner\n" +
        "- Added drop rate for the next pull\n" +
        "- Improved persistence of “favorites only” mode\n" +
        "- Added restrictions for feedback submission",
      jp:
        "GachaNoteをご利用いただきありがとうございます。皆様のために便利な機能を追加し続け、アプリを改善しています。\n\n" +
        "- アプリ内部バージョンの更新\n" +
        "- フィードバック機能の改善と柔軟性の向上\n" +
        "- バナーに「Featured」ラベルを追加\n" +
        "- 次のガチャのドロップ率を表示\n" +
        "- 「お気に入りのみ」モードの永続性の改善\n" +
        "- フィードバック送信時の制限を追加",
    },
    date: '2025-11-24',
  },
  
];