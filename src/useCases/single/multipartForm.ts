import { FastifyRequest, FastifyReply } from 'fastify';
import { getPrediction } from '../../getPrediction.js';
import { FromSchema } from 'json-schema-to-ts';
import sharp from 'sharp';
import * as tf from '@tensorflow/tfjs-node';

export const singleMultipartFormBodySchema = {
  type: 'object',
  properties: {
    content: {
      type: 'array',
      items: {
        $ref: '#mySharedSchema',
      },
    },
  },
  required: ['content'],
} as const;

type BodyEntry = {
  data: Buffer;
  filename: string;
  encoding: string;
  mimetype: string;
  limit: false;
};

export async function SingleMultipartForm(
  request: FastifyRequest<{
    Body: FromSchema<typeof singleMultipartFormBodySchema>;
  }>,
  reply: FastifyReply
) {
  const input = request.body.content[0] as BodyEntry;

  const convert = async (img: Buffer) => {
    // Decoded image in UInt8 Byte array

    const jpeg = await sharp(img)
      .jpeg({ quality: 100 })
      .resize({
        width: 1080,
        height: 1080,
        fit: 'contain',
        withoutEnlargement: true,
      })
      .toBuffer();

    return tf.node.decodeImage(jpeg, 3);
  };

  const image = await convert(input.data);

  return reply.send({
    prediction: await getPrediction(image),
  });
}
