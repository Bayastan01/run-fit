import { View, Text } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/Button";

export default function Welcome() {
  return (
    <View className="flex-1 bg-bg px-6 pt-24 pb-12 justify-between">
      <View className="gap-3">
        <Text className="text-text text-4xl font-bold">Беги.{"\n"}Захватывай.{"\n"}Покоряй.</Text>
        <Text className="text-subtle text-base">
          Каждая улица, по которой ты пробежал, становится твоей. Фракция против фракции, квартал за кварталом.
        </Text>
      </View>
      <Button label="Начать" onPress={() => router.push("/(onboarding)/permissions")} />
    </View>
  );
}
