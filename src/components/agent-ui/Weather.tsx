"use client";

import { Card } from "@/components/ui/card";
import { Message } from "@langchain/langgraph-sdk";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { MapPin } from "lucide-react";

export default function WeatherMessage(props: { city: string }) {
  const thread = useStreamContext<
    { messages: Message[] },
    { MetaType: { ui: any | undefined } }
  >();

  const { city } = props;

  if (!city) return <div>hi</div>;

  return (
    <Card className="p-4 border-l-4 border-blue-500 shadow-sm bg-blue-50 rounded-xl">
      <div className="flex items-center gap-3">
        <MapPin className="text-blue-600" />
        <div>
          <p className="text-sm text-gray-600">Weather Forecast</p>
          <p className="text-lg font-semibold text-gray-800">
            Here's the weather for {city}
          </p>
        </div>
      </div>
    </Card>
  );
}
