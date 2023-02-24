interface Prediction {
  className: string;
  probability: number;
}

interface PredictionsInput {
  predictions: Prediction[][];
}

export function combineResults(input: PredictionsInput): string[] {
  return input.predictions.map((prediction) => {
    let doubleHint = false;
    let hint = false;

    // check for a hint of adult content
    prediction.forEach(({ className, probability }) => {
      if (className === 'Porn' && probability > 0.9) {
        hint = true;
      }
      if (className === 'Hentai' && probability > 0.9) {
        hint = true;
      }
    });

    // check for double hint of adult content
    const porn = prediction.find(({ className }) => className === 'Porn');
    const sexy = prediction.find(({ className }) => className === 'Sexy');
    const hentai = prediction.find(({ className }) => className === 'Hentai');

    if (porn?.probability > 0.3 && sexy?.probability > 0.3) {
      doubleHint = true;
    }

    if (porn?.probability > 0.6 && sexy?.probability > 0.2) {
      doubleHint = true;
    }

    if (porn?.probability > 0.3 && hentai?.probability > 0.3) {
      doubleHint = true;
    }

    if (porn?.probability > 0.5 && hentai?.probability > 0.3) {
      doubleHint = true;
    }

    if (porn?.probability > 0.3 && hentai?.probability > 0.5) {
      doubleHint = true;
    }

    // return result
    if (hint || doubleHint) {
      return 'Adult';
    } else {
      return 'Neutral';
    }
  });
}
