export type CrewPortrait = {
  key: string;
  label: string;
  url: string;
};

const portraitModules = import.meta.glob("./assets/crew-portraits/*.png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const validPortraitKey = /^[a-z0-9][a-z0-9-]{0,63}$/;

function labelFor(key: string): string {
  return key
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const crewPortraits: CrewPortrait[] = Object.entries(portraitModules)
  .map(([path, url]) => {
    const filename = path.split("/").pop() ?? "";
    const key = filename.replace(/\.png$/i, "");
    return { key, label: labelFor(key), url };
  })
  .filter((portrait) => validPortraitKey.test(portrait.key))
  .sort((left, right) => left.label.localeCompare(right.label));

const portraitUrls = new Map(crewPortraits.map((portrait) => [portrait.key, portrait.url]));

export function crewPortraitUrl(key: string | null | undefined): string | null {
  return key ? portraitUrls.get(key) ?? null : null;
}
