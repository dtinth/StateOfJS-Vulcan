import countriesOptions from '../countriesOptions.js';
import { Utils } from 'meteor/vulcan:core';
import pickBy from 'lodash/pickBy';
import { getSurveyFromResponse } from '../surveys/helpers';

/*

Replace all occurences of a string

*/
// eslint-disable-next-line no-extend-native
String.prototype.replaceAll = function(search, replacement) {
  const target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

/*

Take a string ("Front-end") and make it usable as an ID ("frontend")

*/
const disallowedCharacters = '?.(){}[]=>&,/- @*';
export const makeId = str => {
  if (!str) {
    return '';
  }
  let s = str.toLowerCase();
  const charArray = [...disallowedCharacters];
  charArray.forEach(c => {
    s = s.replaceAll(`\\${c}`, '');
  });
  return s;
};

/*

Note: section's slug can be overriden by the question

*/
export const getQuestionFieldName = (survey, section, question) =>{
  const sectionSlug = question.sectionSlug || section.slug;
  let fieldName = survey.slug + '__' + sectionSlug + '__' + question.id;
  if (question.suffix) {
    fieldName += `__${question.suffix}`;
  }
  return fieldName
}

export const getThanksPath = (response) =>{
  const { name, year } = getSurveyFromResponse(response);
  const path = `/survey/${Utils.slugify(name)}/${year}/thanks`;
  return path;
}

export const templates = {
  feature: () => ({
    input: 'radiogroup',
    suffix: 'experience',
    options: [
      {
        value: 'never_heard',
        intlId: 'options.features.never_heard',
      },
      { value: 'heard',  intlId: 'options.features.heard', },
      { value: 'used',  intlId: 'options.features.used', },
    ],
  }),
  pattern: () => ({
    input: 'radiogroup',
    suffix: 'experience',
    options: [
      { value: 'use_never', intlId: 'options.patterns.use_never',},
      { value: 'use_sparingly', intlId: 'options.patterns.use_sparingly', },
      { value: 'use_neutral', intlId: 'options.patterns.use_neutral', },
      { value: 'use_frequently', intlId: 'options.patterns.use_frequently', },
      { value: 'use_always',  intlId: 'options.patterns.use_always',  },
    ],
  }),
  tool: () => ({
    input: 'radiogroup',
    suffix: 'experience',
    intlPrefix: 'entities',
    options: [
      {
        value: 'never_heard',
        intlId: 'options.tools.never_heard',
      },
      { value: 'interested', intlId: 'options.tools.interested',},
      { value: 'not_interested', intlId: 'options.tools.not_interested', },
      { value: 'would_use', intlId: 'options.tools.would_use', },
      { value: 'would_not_use', intlId: 'options.tools.would_not_use', },
    ],
  }),
  proficiency: ({ allowother = false }) => ({
    allowmultiple: false,
    allowother,
    input: 'radiogroup',
    type: Number,
    randomize: false,
    options: [
      { id: 0 },
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
    ]
  }),
  single: ({ allowother = false }) => ({
    allowmultiple: false,
    allowother,
    input: 'radiogroup',
    randomize: false,
  }),
  multiple: ({ id, allowother = false }) => ({
    allowmultiple: true,
    allowother,
    input: 'checkboxgroup',
    randomize: true,
    suffix: 'choices',
  }),
  others: () => ({
    input: 'text',
    suffix: 'others',
  }),
  text: () => ({ input: 'text' }),
  longtext: () => ({ input: 'textarea' }),
  email: () => ({ input: 'email' }),
  opinion: () => ({
    input: 'radiogroup',
    type: Number,
    options: [
      { value: 0, intlId: 'options.opinions.disagree_strongly' },
      { value: 1, intlId: 'options.opinions.disagree' },
      { value: 2, intlId: 'options.opinions.neutral' },
      { value: 3, intlId: 'options.opinions.agree' },
      { value: 4, intlId: 'options.opinions.agree_strongly' },
    ],
  }),
  // statictext: () => ({}),
  happiness: () => ({
    input: 'radiogroup',
    type: Number,
    options: [
      { value: 0, intlId: 'options.happiness.very_unhappy' },
      { value: 1, intlId: 'options.happiness.unhappy' },
      { value: 2, intlId: 'options.happiness.neutral' },
      { value: 3, intlId: 'options.happiness.happy' },
      { value: 4, intlId: 'options.happiness.very_happy' },
    ],
  }),
  country: () => ({
    input: 'select',
    options: countriesOptions,
  }),
};

// build question object from outline
export const getQuestionObject = (questionOrId, section, number) => {
  let questionObject =
    typeof questionOrId === 'string' ? { title: questionOrId } : { ...questionOrId };

  questionObject.id = questionObject.id || makeId(questionObject.title);
  questionObject.slug = questionObject.id;
  questionObject.type = String; // default to String type

  // get template from either question or parent section
  const questionTemplate =
    templates[questionObject.template || section.template];
  if (questionTemplate) {
    questionObject = { ...questionObject, ...questionTemplate(questionObject) };
  }

  // if type is specified, use it
  if (questionObject.fieldType) {
    if (questionObject.fieldType === 'Number') {
      questionObject.type = Number;
    }
  }

  return questionObject;
};

export const parseOptions = (questionObject, options) => {
  return options.map(option => {
    if (typeof option === 'object') {
      // if option is an object, use its id as translation key
      const { id, value } = option;
      const idString = String(id || value);
      return {
        value: id,
        label: idString, // only used as fallback
        intlId:`options.${questionObject.id}.${idString}`,
        ...option
      }
    } else {
      // if option is a string, use it as is
      return { value: option, label: option };
    }
  })
}

export const generateIntlId = (questionObject, section, survey) => {
  const { sectionSlug, id, intlId, intlPrefix, suffix } = questionObject;
  // if intlId is explicitely specified on question object use that
  if (intlId) {
    return intlId;
  }
  // survey namespaces are not currently supported
  // const surveySegment = survey.namespace;
  const surveySegment = '';
  // for section segment, use either intlPrefix, section slug or sectionSlug override on question
  const sectionSegment = intlPrefix || sectionSlug || section.slug;
  const questionSegment = `.${id}`;
  // for now hardcode "others" as the only valid suffix
  const suffixSegment = suffix && suffix === 'others' ? '.others' : '';
  return [surveySegment, sectionSegment, questionSegment, suffixSegment].join('');
}

// transform question object into SimpleSchema-compatible schema field
export const getQuestionSchema = (questionObject, section, survey) => {
  const {
    id,
    title,
    description,
    input,
    options,
    type,
    searchable = false,
    allowmultiple = false,
    alias,
  } = questionObject;

  const intlId = generateIntlId(questionObject, section, survey);

  const questionSchema = {
    // label: title,
    label: alias || title,
    intlId,
    description,
    type,
    optional: true,
    // canRead: isprivate ? ['owners'] : ['members'],
    canRead: ['members'], // note: for now data is not public so all fields can be set to ['members']
    canCreate: ['members'],
    canUpdate: ['members'],
    input,
    searchable,
    itemProperties: {
      questionId: id,
    }
  };

  if (options) {
    questionSchema.options = parseOptions(questionObject, options);
  }

  if (allowmultiple) {
    questionSchema.type = Array;
    questionSchema.arrayItem = {
      type: String,
            optional: true,
    }
  }

  return questionSchema;
};

/*

Take a raw survey YAML and process it to give ids, fieldNames, etc.
to every question

*/
export const parseSurvey = survey => {
  let i = 0;
  const parsedSurvey = { ...survey, createdAt: new Date(survey.createdAt) };
  parsedSurvey.outline = survey.outline.map(section => {
    return {
      ...section,
      questions:
        section.questions &&
        section.questions.map(question => {
          i++;
          const questionObject = getQuestionObject(question, section, i);
          questionObject.fieldName = getQuestionFieldName(survey, section, questionObject);
          return questionObject;
        })
    };
  });
  return parsedSurvey;
};

export const ignoredFieldTypes = ['email', 'text', 'longtext'];

export const getCompletionPercentage = response => {
  let completedCount = 0;
  let totalCount = 0;
  const survey = getSurveyFromResponse(response);
  const parsedOutline = parseSurvey(survey).outline;
  parsedOutline.forEach(section => {
    section.questions && section.questions.forEach(question => {
      const questionId = getQuestionFieldName(survey, section, question);
      const answer = response[questionId];
      totalCount ++;
      if (!ignoredFieldTypes.includes(question.template) && answer !== null && typeof answer !== 'undefined') {
        completedCount++;
      }
    });
  });
  const completion = Math.round(completedCount*100/totalCount);
  return completion;
}

/*

Filter a response object to only keep fields relevant to the survey

*/
export const getResponseData = response => {
  return pickBy(response, (r, k) => k.includes(response.surveySlug))
}


