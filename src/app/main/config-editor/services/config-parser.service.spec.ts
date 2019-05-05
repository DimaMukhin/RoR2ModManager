import { TestBed } from '@angular/core/testing';

import {
  ConfigParserService,
  ConfigMapValue,
  ConfigMap
} from './config-parser.service';
import { ElectronService } from '../../../core/services/electron.service';
import {
  MockElectronService,
  MockPreferencesService
} from '../../../core/services/mocks.spec';
import { PreferencesService } from '../../../core/services/preferences.service';

describe('ConfigParserService', () => {
  let service: ConfigParserService;

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        ConfigParserService,
        { provide: ElectronService, useClass: MockElectronService },
        { provide: PreferencesService, useClass: MockPreferencesService }
      ]
    })
  );

  beforeEach(() => {
    service = TestBed.get(ConfigParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseSectionBody', () => {
    it('ignores comments', () => {
      const test = '# this is a comment';
      const expected: ConfigMap = {};

      const result = service.parseSectionBody(test);

      expect(result).toEqual(expected);
    });

    it('parses a number value', () => {
      const test = 'key = 123';
      const expected: ConfigMap = {
        key: { type: 'number', value: 123 }
      };

      const result = service.parseSectionBody(test);

      expect(result).toEqual(expected);
    });

    it('parses a boolean value', () => {
      const test = 'key = true';
      const expected: ConfigMap = {
        key: { type: 'boolean', value: true }
      };

      const result = service.parseSectionBody(test);

      expect(result).toEqual(expected);
    });

    it('parses unquoted string values', () => {
      const test = 'key = This is a test';
      const expected: ConfigMap = {
        key: { type: 'string', value: 'This is a test' }
      };

      const result = service.parseSectionBody(test);

      expect(result).toEqual(expected);
    });

    it('parses quoted string values', () => {
      const test = 'key = "This is a test"';
      const expected: ConfigMap = {
        key: { type: 'string', value: 'This is a test' }
      };

      const result = service.parseSectionBody(test);

      expect(result).toEqual(expected);
    });

    it('handles no whitespace around keys/value pairs', () => {
      const test = 'key=true';
      const expected: ConfigMap = {
        key: { type: 'boolean', value: true }
      };

      const result = service.parseSectionBody(test);

      expect(result).toEqual(expected);
    });

    it('handles extra whitespace around keys/value pairs', () => {
      const test = 'key   \t=  true';
      const expected: ConfigMap = {
        key: { type: 'boolean', value: true }
      };

      const result = service.parseSectionBody(test);

      expect(result).toEqual(expected);
    });

    it('can parse multiple key/value pairs at once', () => {
      const test =
        'key1 = true\nkey2 = 123\nkey3 = Some test string\nkey4=false';
      const expected: ConfigMap = {
        key1: { type: 'boolean', value: true },
        key2: { type: 'number', value: 123 },
        key3: { type: 'string', value: 'Some test string' },
        key4: { type: 'boolean', value: false }
      };

      const result = service.parseSectionBody(test);

      expect(result).toEqual(expected);
    });

    it('saves descriptions for keys from comments', () => {
      const test = '# Simple test key that does nothing\nkey=true';
      const expected: ConfigMap = {
        key: {
          type: 'boolean',
          value: true,
          description: 'Simple test key that does nothing'
        }
      };

      const result = service.parseSectionBody(test);

      expect(result).toEqual(expected);
    });
  });

  describe('parseString', () => {
    const parsedBody = {};
    beforeEach(() => {
      spyOn(service, 'parseSectionBody').and.returnValue(parsedBody);
    });

    it('parses simple section headers properly', () => {
      const sectionTitle = 'Foo';
      const sectionBody = 'key=bar';
      const test = `[${sectionTitle}]\n${sectionBody}`;

      const expected: ConfigMap = {
        Foo: {
          type: 'object',
          value: parsedBody
        }
      };

      const result = service.parseString(test);

      expect(result).toEqual(expected);
    });

    it('parses multiple simple section headers properly', () => {
      const sectionTitle = 'Foo';
      const sectionBody = 'key=bar';
      const test = `[${sectionTitle}]\n${sectionBody}\n[${sectionTitle}2]\n${sectionBody}`;

      const expected: ConfigMap = {
        Foo: {
          type: 'object',
          value: parsedBody
        },
        Foo2: {
          type: 'object',
          value: parsedBody
        }
      };

      const result = service.parseString(test);

      expect(result).toEqual(expected);
    });

    it('parses nicely nested sections', () => {
      const parentSectionTitle = 'Foo';
      const childSectionTitle = 'Bar';
      const sectionBody = 'key=bar';
      const test = `[${parentSectionTitle}]\n${sectionBody}\n[${parentSectionTitle}.${childSectionTitle}]\n${sectionBody}`;

      const expected: ConfigMap = {
        [parentSectionTitle]: {
          type: 'object',
          value: {
            ...parsedBody,
            [childSectionTitle]: {
              type: 'object',
              value: parsedBody
            }
          }
        }
      };

      const result = service.parseString(test);

      expect(result).toEqual(expected);
    });
  });
});
