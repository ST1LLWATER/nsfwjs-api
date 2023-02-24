import * as tf from '@tensorflow/tfjs-node';
import { Tensor3D, Tensor4D } from '@tensorflow/tfjs-node';
import * as nsfwjs from 'nsfwjs';

tf.enableProdMode();

const model = await nsfwjs.load('file://src/model/', { size: 299 });

interface Image {
  data: Uint32Array | Array<number>;
  width: number;
  height: number;
}

export async function getPrediction(image: Tensor3D | Tensor4D) {
  //   const tfImage = tf.node.decodeImage(imageBuffer, 3);

  const prediction = await model.classify(image);

  image.dispose();

  return prediction;
}
