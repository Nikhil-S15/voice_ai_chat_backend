const validTaskTypes = [
  'prolonged_vowel', 'maximum_phonation', 'rainbow_passage', 
  'pitch_glides', 'loudness_task', 'free_speech', 'respiration_observation',
  'reflex_cough', 'voluntary_cough', 'breath_sounds',
  'malayalam_vowels', 'malayalam_consonants', 'malayalam_words', 'malayalam_passage'
];

const validLanguages = ['en', 'ml'];

exports.validateRecording = (data) => {
  const errors = [];
  
  if (!data.userId) errors.push("User ID is required");
  if (!data.sessionId) errors.push("Session ID is required");
  if (!validTaskTypes.includes(data.taskType)) {
    errors.push("Invalid task type");
  }
  if (!validLanguages.includes(data.language)) {
    errors.push("Invalid language");
  }
  if (!data.audioFile) errors.push("Audio file is required");
  
  return {
    valid: errors.length === 0,
    errors
  };
};