const languages = [
  {
    name: 'Arabic',
    code: 'AR',
  },
  {
    name: 'Urdu (Roman)',
    code: 'RU',
  },
  {
    name: 'Urdu',
    code: 'UR',
  },
];

const allLanguages = [
  {
    name: 'English',
    code: 'EN',
  },
  {
    name: 'Arabic',
    code: 'AR',
  },
  {
    name: 'Urdu (Roman)',
    code: 'RU',
  },
  {
    name: 'Urdu',
    code: 'UR',
  },
];

const attributes = {
  name: 'NAME',
  description: 'DESCRIPTION'
};

const getLanguageFromCode = languageCode => {
  switch (languageCode) {
    case 'EN': return "English";
    case 'AR': return "Arabic";
    case 'UR': return "Urdu";
    case 'RU': return "Urdu (Roman)";
    default: return "English";
  }
};

export {
  languages, 
  attributes,
  allLanguages,
  getLanguageFromCode,
};
