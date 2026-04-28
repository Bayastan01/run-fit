import { NativeModules, Platform } from "react-native";

type Locale = "ru" | "en";

const ru = {
  "common.loading": "Загрузка…",
  "common.refresh": "Обновить",
  "common.back": "Назад",
  "common.cancel": "Отмена",
  "common.confirm": "Подтвердить",
  "common.error": "Ошибка",
  "common.empty": "Пусто",
  "common.km": "км",
  "common.min": "мин",
  "common.h": "ч",

  "auth.welcome_back": "С возвращением",
  "auth.create_account": "Создать аккаунт",
  "auth.login": "Войти",
  "auth.register": "Зарегистрироваться",
  "auth.email": "Email",
  "auth.password": "Пароль",
  "auth.display_name": "Имя",
  "auth.no_account": "Нет аккаунта?",
  "auth.have_account": "Уже есть аккаунт?",
  "auth.login_with_google": "Войти через Google",
  "auth.login_with_apple": "Войти через Apple",

  "map.balance": "Баланс",
  "map.start_run": "Старт",
  "map.protect": "🛡️ Защитить",
  "map.attack": "⚔️ Атаковать",
  "map.boosts": "Усиления",

  "wallet.title": "Кошелёк",
  "wallet.balance": "БАЛАНС",
  "wallet.today": "Сегодня",
  "wallet.week": "Неделя",
  "wallet.history": "ИСТОРИЯ",
  "wallet.withdraw": "Вывести",
  "wallet.empty": "Нет транзакций. Беги — захватывай улицы.",

  "profile.title": "Профиль",
  "profile.level": "Уровень",
  "profile.streak": "дней подряд",
  "profile.history_runs": "История пробежек",
  "profile.achievements": "Достижения",
  "profile.logout": "Выйти",
  "profile.coins": "Баланс монет",
  "profile.territories": "Территории",
  "profile.runs": "Пробежек",
  "profile.kilometers": "Километров",
  "profile.best_chain": "ЛУЧШАЯ ЦЕПЬ",

  "battles.title": "Битвы",
  "battles.active": "Активные",
  "battles.resolved": "Завершённые",
  "battles.you_attacking": "Ты атакуешь",
  "battles.you_defending": "Ты защищаешь",
  "battles.empty_active": "Тапни на чужую улицу на карте — объяви атаку.",
  "battles.victory": "🏆 Победа",
  "battles.defeat": "Поражение",

  "neighbours.title": "Соседи",
  "neighbours.close": "Близко",
  "neighbours.area": "Район",
  "neighbours.city": "Город",
  "neighbours.empty": "Пока нет соседей в этом радиусе.",

  "leaderboards.title": "Топы",
  "leaderboards.distance_week": "Километры",
  "leaderboards.captures_week": "Захваты",
  "leaderboards.coins_week": "Монеты",
  "leaderboards.level": "Уровень",

  "achievements.title": "Достижения",
  "achievements.unlocked": "разблокировано",

  "quests.title": "Дневные задания",
  "quests.claim": "Забрать",
  "quests.completed": "Выполнено",
  "quests.reward": "Награда",
};

const en: typeof ru = {
  "common.loading": "Loading…",
  "common.refresh": "Refresh",
  "common.back": "Back",
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.error": "Error",
  "common.empty": "Empty",
  "common.km": "km",
  "common.min": "min",
  "common.h": "h",

  "auth.welcome_back": "Welcome back",
  "auth.create_account": "Create account",
  "auth.login": "Sign in",
  "auth.register": "Sign up",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.display_name": "Display name",
  "auth.no_account": "No account?",
  "auth.have_account": "Already registered?",
  "auth.login_with_google": "Continue with Google",
  "auth.login_with_apple": "Continue with Apple",

  "map.balance": "Balance",
  "map.start_run": "Start",
  "map.protect": "🛡️ Defend",
  "map.attack": "⚔️ Attack",
  "map.boosts": "Boosts",

  "wallet.title": "Wallet",
  "wallet.balance": "BALANCE",
  "wallet.today": "Today",
  "wallet.week": "Week",
  "wallet.history": "HISTORY",
  "wallet.withdraw": "Withdraw",
  "wallet.empty": "No transactions yet. Run — claim streets.",

  "profile.title": "Profile",
  "profile.level": "Level",
  "profile.streak": "day streak",
  "profile.history_runs": "Run history",
  "profile.achievements": "Achievements",
  "profile.logout": "Log out",
  "profile.coins": "Coin balance",
  "profile.territories": "Territories",
  "profile.runs": "Runs",
  "profile.kilometers": "Kilometres",
  "profile.best_chain": "BEST CHAIN",

  "battles.title": "Battles",
  "battles.active": "Active",
  "battles.resolved": "Resolved",
  "battles.you_attacking": "You attack",
  "battles.you_defending": "You defend",
  "battles.empty_active": "Tap an enemy street on the map — declare attack.",
  "battles.victory": "🏆 Victory",
  "battles.defeat": "Defeat",

  "neighbours.title": "Neighbours",
  "neighbours.close": "Close",
  "neighbours.area": "Area",
  "neighbours.city": "City",
  "neighbours.empty": "No neighbours in this radius yet.",

  "leaderboards.title": "Leaderboards",
  "leaderboards.distance_week": "Distance",
  "leaderboards.captures_week": "Captures",
  "leaderboards.coins_week": "Coins",
  "leaderboards.level": "Level",

  "achievements.title": "Achievements",
  "achievements.unlocked": "unlocked",

  "quests.title": "Daily quests",
  "quests.claim": "Claim",
  "quests.completed": "Completed",
  "quests.reward": "Reward",
};

const dictionaries: Record<Locale, typeof ru> = { ru, en };

let currentLocale: Locale = "ru";

export function detectLocale(): Locale {
  try {
    const raw = Platform.OS === "ios"
      ? (NativeModules.SettingsManager?.settings?.AppleLocale
          ?? NativeModules.SettingsManager?.settings?.AppleLanguages?.[0])
      : NativeModules.I18nManager?.localeIdentifier;
    if (typeof raw === "string" && raw.toLowerCase().startsWith("en")) return "en";
  } catch {}
  return "ru";
}

export function setLocale(l: Locale): void {
  currentLocale = l;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: keyof typeof ru): string {
  return dictionaries[currentLocale][key] ?? key;
}

currentLocale = detectLocale();
