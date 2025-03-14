
import { useMemo, useCallback } from "react";

export const useMessageVariations = () => {
  const messageVariations = useMemo(() => ({
    "Analyzing your input...": [
      "Reading your makeup vibes... 👀",
      "Decoding your beauty DNA... 🔍",
      "Translating your beauty language... 💬"
    ],
    "We detected: ": [
      "Found your beauty match: ",
      "I'm seeing: ",
      "Got it, you're looking for: "
    ],
    "Heyyy! We're on the hunt for the perfect dupes for you! 🎨": [
      "Obsessed with finding your makeup twin rn 💄",
      "BRB, snatching dupes that hit different ✨",
      "Your wallet's about to thank us so hard 💸",
    ],
    "Oh, we already know this one! Let's show you the dupes... 🌟": [
      "This one's giving main character energy—dupes loading 💅",
      "Bestie we already know this vibe—check these out ☕",
    ],
    "Scouring the beauty universe for your perfect match... 💄": [
      "First one to ask for this—we're on a whole journey rn 🏄‍♀️",
      "New to our algorithm—breaking the internet for you 🔥",
    ],
    "Found some matches! Creating initial entries...": [
      "Caught some serious dupes—they ate 🔥",
      "These matches are so valid—just perfecting the vibe 💫",
    ],
    "Putting together your beauty dossier... 📋": [
      "Manifest your new go-to's in 3, 2, 1... ✨",
      "Dropping your beauty rotation upgrade 💁‍♀️",
    ],
    "Checking our database for existing dupes...": [
      "Scouring our beauty vault for matches... 💼",
      "Checking if we've already found this gem... 💎",
    ],
    "Gathering detailed information in the background...": [
      "Summoning all the tea on these dupes... ☕",
      "Deep diving for those hidden details... 🔍",
    ],
    "Your dupes are ready! Loading details...": [
      "Dupes served hot and fresh! 🔥",
      "Dupe mission accomplished! 🚀",
    ]
  }), []);

  const getRandomVariation = useCallback((serverMessage: string) => {
    for (const prefix in messageVariations) {
      if (serverMessage.startsWith(prefix) && messageVariations[prefix]) {
        const variations = messageVariations[prefix];
        const randomPrefix = variations[Math.floor(Math.random() * variations.length)];
        return randomPrefix + serverMessage.substring(prefix.length);
      }
    }
    
    const variations = messageVariations[serverMessage];
    return variations?.length > 0
      ? variations[Math.floor(Math.random() * variations.length)]
      : serverMessage;
  }, [messageVariations]);

  return { getRandomVariation };
};

export const useBeautyTips = () => {
  const tips = useMemo(() => [
    "Apply foundation with a damp sponge for a natural finish.",
    "Use lip liner to prevent lipstick bleeding.",
    "Set makeup with a light mist for longer wear.",
    "Store mascara horizontally for better formula consistency.",
    "When using cream products, apply before powder for better blending.",
    "Concealer should be one shade lighter than your foundation for brightening.",
    "Use a highlighter in the inner corners of eyes to look more awake.",
    "Warm up your eyelash curler for 5 seconds with a hairdryer for better curl.",
    "Powder your face before applying blush to help it last longer.",
    "Use a setting spray to make your makeup last all day long."
  ], []);

  const getRandomTip = useCallback(() => tips[Math.floor(Math.random() * tips.length)], [tips]);

  return { getRandomTip };
};
