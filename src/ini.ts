// eslint-disable-next-line functional/prefer-readonly-type
type Ini = Record<string, string[] | string>;

const decode = (value: string) => {
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value;
  }
};

const parseIni = (text: string): Ini => {
  const dict: Ini = Object.create(null);

  for (const [, section, key, , value] of text.matchAll(
    /^[ \t]*(?:[;#].*|(?:\[(.*)\]|(.*?)[ \t]*=[ \t]*(['"]?)(.*?)\3)(?:[ \t]*(?<=(?:^|[^\\])(?:\\{2})*)[;#].*)?)[ \t]*$/gmu,
  )) {
    if (section != null) {
      // We don't care about any configuration inside a section.
      break;
    }

    if (key == null || value == null) {
      continue;
    }

    dict[key] = decode(value);
  }

  return dict;
};

export { type Ini, parseIni };
