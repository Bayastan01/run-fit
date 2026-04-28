import { TextInput, View, Text, type TextInputProps } from "react-native";

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, ...rest }: TextFieldProps) {
  return (
    <View className="gap-1">
      <Text className="text-subtle text-sm">{label}</Text>
      <TextInput
        {...rest}
        placeholderTextColor="#5A6273"
        className="bg-input border border-border rounded-xl px-4 py-3 text-white"
      />
      {error ? <Text className="text-danger text-xs">{error}</Text> : null}
    </View>
  );
}
