const generateReference = (prefix = 'DEV', sequenceNumber = 1) => {
  const currentYear = new Date().getFullYear();
  const paddedSequence = String(sequenceNumber).padStart(6, '0');
  return `${prefix}-${currentYear}-${paddedSequence}`;
};

module.exports = {
  generateReference,
};
