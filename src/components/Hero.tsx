import { useState } from "react";

// Example Hero component snippet
const Hero = () => {
  const [progressMessage, setProgressMessage] = useState("");

  // Define the message variations
  const messageVariations = {
    "Heyyy! We're on the hunt for the perfect dupes for you! 🎨": [
      "Let’s track down some amazing dupes for you! ✨",
      "Hold tight, we’re searching for your perfect matches! 🔎",
      "Your dupe quest is officially underway! 🚀",
      "We’re digging into the beauty vault for you! 🗝️",
    ],
    "Oh, we already know this one! Let's show you the dupes... 🌟": [
      "Good news! We’ve got this one covered—dupes incoming! 🌈",
      "This one’s in our books—showing you the dupes now! 📖",
      "No need to search far, we’ve got dupes ready! ⚡",
      "We recognize this beauty—dupes on the way! 🎉",
    ],
    "Scouring the beauty universe for your perfect match... 💄": [
      "Exploring the makeup galaxy for your match... 🌌",
      "Sweeping the beauty world for your dupes... 🌍",
      "Diving deep into the cosmetic cosmos... 🪐",
      "Searching high and low for your perfect find... 🕵️‍♀️",
    ],
    "Found some gems! Let's doll them up with more details... 💎": [
      "We’ve struck gold—polishing your dupes now! 💰",
      "Dupes spotted—adding some sparkle to them! ✨",
      "Treasures found—making them picture-perfect! 🎨",
      "Got some keepers—enhancing the details! 💅",
    ],
    "Putting together your beauty dossier... 📋": [
      "Assembling your dupe masterpiece... 📜",
      "Crafting your personalized beauty file... 📑",
      "Finalizing your dupe lineup—almost there! 🎯",
      "Packaging your beauty finds with care... 🎁",
    ],
  };

  const handleSearch = async () => {
    // Simulated search logic with EventSource or fetch
    const eventSource = new EventSource("your-search-endpoint");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "progress") {
        // Get the server message and pick a random variation
        const variations = messageVariations[data.message] || [data.message]; // Fallback to original if no variations
        const randomVariation = variations[Math.floor(Math.random() * variations.length)];
        setProgressMessage(randomVariation);
      } else if (data.type === "result") {
        // Handle result (e.g., redirect)
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
  };

  return (
    <div>
      <button onClick={handleSearch}>Search</button>
      {progressMessage && <p>{progressMessage}</p>}
    </div>
  );
};

export default Hero;