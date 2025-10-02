import { Image, View } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Composant d'onboarding/démo affiché au premier lancement de l'application.
 * Présente les principales fonctionnalités de Gachanote à l'utilisateur.
 *
 * @param onFinish Fonction appelée à la fin ou lors du skip de la démo.
 */
export default function DemoScreen({ onFinish }: { onFinish: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Onboarding
        onDone={onFinish}
        onSkip={onFinish}
        bottomBarHighlight={false}
        containerStyles={{ flex: 1 }}
        bottomBarColor="#fff" // Ajoute un fond blanc à la barre du bas
        bottomBarHeight={72 + insets.bottom} // Augmente la hauteur de la barre du bas
        pages={[
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/images/icon.png')} style={{ width: 120, height: 120 }} />,
            title: 'Bienvenue sur Gachanote',
            subtitle: 'Suivez vos tirages et vos dépenses sur vos jeux gacha favoris.',
          },
          {
            backgroundColor: '#f2f2f2',
            image: <Image source={require('@/assets/flags/fr.png')} style={{ width: 80, height: 60 }} />,
            title: 'Choisissez votre nationalité',
            subtitle: 'La devise s’adapte automatiquement.',
          },
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/accueil.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: 'Sélectionnez un gacha',
            subtitle: 'Sur l’accueil, choisissez le gacha de votre choix pour commencer à suivre vos tirages.',
          },
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/detail_1.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: 'Détail du gacha',
            subtitle: 'Retrouvez ici tous les rolls spécifiques au gacha sélectionné.',
          },
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/form_1.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: 'Ajoutez un tirage',
            subtitle: 'Renseignez les champs comme dans l’exemple. Les ressources mises, vedettes obtenues et la date sont obligatoires.',
          },
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/detail_2.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: 'Résultats enregistrés',
            subtitle: 'Vos résultats sont sauvegardés et consultables à tout moment.',
          },
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/form_2.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: 'Onglet Argent',
            subtitle: 'Pour les cash players, enregistrez et suivez vos dépenses sur chaque gacha.',
          },
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/detail_3.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: 'Dépenses enregistrées',
            subtitle: 'Comme pour les rolls, vos dépenses sont sauvegardées et affichées.',
          },
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/detail_4.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: 'Statistiques du gacha',
            subtitle: 'Consultez le nombre de persos obtenus, les ressources et l’argent total mis sur ce gacha.',
          },
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/stats.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: 'Statistiques globales',
            subtitle: 'Visualisez l’argent mis sur tous vos gachas, voyez sur quel jeu vous dépensez le plus et filtrez par date pour des périodes spécifiques.',
          },
        ]}
      />
    </View>
  );
}