import React from 'react';
import { Link } from 'react-router-dom';

import { HeartIcon, EditIcon } from '../icons';

import PageTitle from '../components/Typography/PageTitle';
import SectionTitle from '../components/Typography/SectionTitle';
import CTA from '../components/CTA';
import { Button } from '@windmill/react-ui';

function Buttons() {
  return (
    <>
      <PageTitle>Buttons</PageTitle>

      <CTA />

    <SectionTitle>Primary</SectionTitle>
      <div className="flex flex-col flex-wrap mb-8 space-y-4 md:flex-row md:items-end md:space-x-4">
        
        <div>
          <Button layout="link" disabled>
            Disabled
          </Button>
        </div>

        <div>
          <Button layout="link" size="small">
            Small
          </Button>
        </div>
      </div>

      <SectionTitle>Icons</SectionTitle>
      <div className="flex flex-col flex-wrap mb-8 space-y-4 md:flex-row md:items-end md:space-x-4">
        <div>
          {/* @ts-ignore */}
          <Button iconRight={HeartIcon}>
            <span>Icon right</span>
          </Button>
        </div>

        <div>
          {/* @ts-ignore */}
          <Button iconLeft={HeartIcon}>
            <span>Icon Left</span>
          </Button>
        </div>

        <div>
          {/* @ts-ignore */}
          <Button icon={HeartIcon} aria-label="Like" />
        </div>

        <div>
          {/* @ts-ignore */}
          <Button icon={EditIcon} aria-label="Edit" />
        </div>

        <div>
          {/* @ts-ignore */}
          <Button icon={HeartIcon} layout="link" aria-label="Like" />
        </div> 
        <div>
          {/* @ts-ignore */}
          <Button icon={HeartIcon} layout="outline" aria-label="Like" />
        </div>
      </div>
    </>
  );
};

export default Buttons;
