/**
 * Demo page for SmartText AI
 * This is the main entry point for the demo environment
 */

import { DemoProvider } from "./context/demo-context";
import DemoLayout from "./components/DemoLayout";

export const metadata = {
  title: "SmartText AI Demo",
  description: "Interactive demo of SmartText AI's missed call response system",
};

export default function DemoPage() {
  return (
    <DemoProvider>
      <DemoLayout />
    </DemoProvider>
  );
}
