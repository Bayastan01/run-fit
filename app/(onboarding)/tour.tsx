import { useState } from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import { router, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, Zap, Trophy, ChevronRight } from "lucide-react-native";

const { width } = Dimensions.get("window");

interface Step {
  icon: React.ReactNode;
  color: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: <MapPin size={40} color="#00ff88" />,
    color: "#00ff88",
    title: "Беги по своему городу",
    body: "Каждая улица OpenStreetMap — это игровая зона. Пробежал по ней >30 % длины — она твоя.",
  },
  {
    icon: <Zap size={40} color="#f59e0b" />,
    color: "#f59e0b",
    title: "Цепь бонусов",
    body: "Не сбавляй темп — растёт цепочка ×1 → ×5. Чем дольше бежишь без остановки, тем больше монет.",
  },
  {
    icon: <Trophy size={40} color="#8b5cf6" />,
    color: "#8b5cf6",
    title: "Захватывай и защищай",
    body: "Замкни петлю — получишь полигон. Чужие улицы можно атаковать. Доход капает каждый час.",
  },
];

export default function TourScreen() {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];

  function next(): void {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      router.replace("/(onboarding)/permissions");
    }
  }

  function skip(): void {
    router.replace("/(onboarding)/permissions");
  }

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="absolute right-5 top-14">
        <Pressable onPress={skip}>
          <Text className="text-subtle text-sm">Пропустить</Text>
        </Pressable>
      </View>

      <View className="flex-1 justify-center items-center px-8">
        <View
          style={{
            width: 96, height: 96, borderRadius: 48,
            backgroundColor: `${cur.color}26`,
            borderWidth: 2, borderColor: `${cur.color}66`,
            alignItems: "center", justifyContent: "center",
            marginBottom: 32,
            shadowColor: cur.color, shadowOpacity: 0.6, shadowRadius: 32,
          }}
        >
          {cur.icon}
        </View>

        <Text className="text-white text-3xl font-bold text-center mb-4">{cur.title}</Text>
        <Text className="text-subtle text-base text-center leading-relaxed" style={{ maxWidth: width - 80 }}>
          {cur.body}
        </Text>
      </View>

      <View className="px-6 pb-12">
        <View className="flex-row justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                backgroundColor: i === step ? cur.color : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </View>

        <Pressable onPress={next}>
          <LinearGradient
            colors={[cur.color, cur.color]}
            style={{
              borderRadius: 16, paddingVertical: 16,
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Text style={{ color: "#000", fontWeight: "700", fontSize: 16 }}>
              {step < STEPS.length - 1 ? "Дальше" : "Поехали!"}
            </Text>
            <ChevronRight size={18} color="#000" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
