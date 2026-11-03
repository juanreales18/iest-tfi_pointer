import React from 'react';
import {Composition} from 'remotion';
import {Ciudad} from './Ciudad';
import {Spot, TOTAL} from './Spot';
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Spot" component={Spot} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />
    <Composition id="Prueba" component={Ciudad} durationInFrames={240} fps={30} width={1920} height={1080} />
  </>
);
