import Bonjour from "bonjour-service";

export function advertise(port: number): void {
  const bonjour = new Bonjour();
  bonjour.publish({
    name: "Piggy Bank Sync",
    type: "piggybank",
    protocol: "tcp",
    port,
  });
  console.log(`mDNS: advertising _piggybank._tcp on port ${port}`);
}
