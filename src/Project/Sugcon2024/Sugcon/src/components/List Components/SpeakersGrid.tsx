import { useState, useEffect } from 'react';
import { Box, Heading, SimpleGrid } from '@chakra-ui/react';
import { Field, TextField, Text as JssText } from '@sitecore-jss/sitecore-jss-nextjs';
import { PersonFields, PersonProps, Default as Person } from '../Basic Components/Person';
import { isEditorActive } from '@sitecore-jss/sitecore-jss-nextjs/utils';
import * as cheerio from 'cheerio';

// Define the type of props that People Grid will accept
interface Fields {
  /** Headline */
  Headline: TextField;

  /** Sessions List Title */
  SessionsListTitle: Field<string>;

  /** Url for sessionize speaker data */
  SessionizeSpeakerUrl: Field<string>;
}

// Define the type of props for an Person
interface PersonItem {
  /** Display name of the person item */
  displayName: string;

  /** The details of a person */
  fields: PersonFields;

  /** The item id of the person item */
  id: string;

  /** Name of the person item */
  name: string;

  /** Url of the person item */
  url: string;
}

export type PeopleGridProps = {
  params: { [key: string]: string };
  fields: Fields;
};

function getPeople(sessionTitle: string, body: string) {
  const people: Array<PersonItem> = [];
  const $ = cheerio.load(body);

  const speakers = $('.sz-speaker--full');
  for (let i = 0; i < speakers.length; i++) {
    const image = $('.sz-speaker__photo img', speakers[i])[0];
    const name = $('.sz-speaker__name', speakers[i]).text();
    const tagline = $('.sz-speaker__tagline', speakers[i]).text().trim();
    let bio = $('.sz-speaker__bio', speakers[i]).text();
    const sessions = $('.sz-speaker__sessions li a', speakers[i]);

    if (sessions.length > 0) {
      bio = bio.concat('<h4>' + sessionTitle + '</h4>');
      bio = bio.concat('<ul>');

      sessions.each((_i, el) => {
        bio = bio.concat('<li>' + $(el).text() + '</li>');
      });

      bio = bio.concat('</ul>');
    }

    const prsn: PersonItem = {
      displayName: name,
      fields: {
        Twitter: { value: {} },
        Company: {
          value: '',
        },
        Name: {
          value: name,
        },
        JobRole: {
          value: tagline,
        },
        Biography: {
          value: bio,
        },
        Linkedin: { value: {} },
        Image: {
          value: {
            src: image.attribs.src,
            alt: image.attribs.alt,
            width: '400',
            height: '400',
          },
        },
      },
      id: '',
      name: name,
      url: '',
    };

    people.push(prsn);
  }

  return people;
}

export const Default = (props: PeopleGridProps): JSX.Element => {
  const styles = props.params && props.params.Styles ? props.params.Styles : '';
  const cols = props.params && props.params.Columns ? parseInt(props.params.Columns) : 4;

  const [people, setPeople] = useState(Array<PersonItem>);

  useEffect(() => {
    fetch(props.fields.SessionizeSpeakerUrl?.value)
      .then((response) => {
        if (response.ok) {
          return response.text();
        } else {
          throw response;
        }
      })
      .then((data) => {
        setPeople(getPeople(props.fields.SessionsListTitle?.value, data));
      })
      .catch((error) => {
        console.log('Error fetching data: ' + error);
      });
  });

  if (props.params && props.params.Alphabetize == '1') {
    people.sort((a, b) => (a.fields?.Name?.value + '' > b.fields?.Name?.value + '' ? 1 : -1));
  }

  return (
    <Box w="100%" mt={20} className={styles}>
      <Box w="80%" pt={10} m="auto">
        {(isEditorActive() || props.fields?.Headline?.value !== '') && (
          <Heading as="h2" size="lg">
            <JssText field={props.fields.Headline} />
          </Heading>
        )}
        <SimpleGrid columns={{ base: 1, md: cols }} mt={10}>
          {people.map((person, idx) => {
            const pp: PersonProps = {
              params: props.params,
              fields: person.fields,
            };
            return <Person key={idx} {...pp}></Person>;
          })}
        </SimpleGrid>
      </Box>
    </Box>
  );
};
