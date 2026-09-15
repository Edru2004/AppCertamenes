import CustomDrawer from '@/components/custom-drawer';
import { Drawer } from 'expo-router/drawer';
import { StyleSheet, Text, View } from 'react-native';

export default function RootLayout() {
  return (
    <Drawer
      drawerContent={(props: any) => <CustomDrawer {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#002b45' },
        headerTintColor: '#fff',
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            <Text style={styles.headerTitleText}>ITSSMT</Text>
          </View>
        ),
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          headerTitle: '',
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  headerRightContainer: {
    marginRight: 15,
  },
  headerTitleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});