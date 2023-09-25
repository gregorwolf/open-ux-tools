import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { initIcons } from '@sap-ux/ui-components';

import { render } from '../../utils';
import { FilterName } from '../../../../src/slice';
import type { FilterOptions, ChangesSlice, default as reducer } from '../../../../src/slice';
import { DeviceType } from '../../../../src/devices';
import { registerAppIcons } from '../../../../src/icons';
import { ChangesPanel } from '../../../../src/panels/changes';
import { initI18n } from '../../../../src/i18n';
import type { PendingPropertyChange, SavedPropertyChange } from '@sap-ux-private/control-property-editor-common';

export type State = ReturnType<typeof reducer>;

const getEmptyModel = (): ChangesSlice => {
    const model: ChangesSlice = {
        controls: {} as any,
        pending: [],
        saved: []
    };
    return model;
};

const getModel = (saved = false): ChangesSlice => {
    const model: ChangesSlice = {
        controls: {} as any,
        pending: !saved
            ? ([
                  {
                      controlId: 'testId1',
                      controlName: 'controlName1',
                      propertyName: 'testPropertyName1',
                      type: 'pending',
                      value: 'testValue1',
                      isActive: true
                  },
                  {
                      controlId: 'testId1BoolFalse',
                      controlName: 'controlNameBoolFalse',
                      propertyName: 'testPropertyNameBoolFalse',
                      type: 'pending',
                      value: false,
                      isActive: true
                  },
                  {
                      controlId: 'testId1Exp',
                      controlName: 'controlNameExp',
                      propertyName: 'testPropertyNameExp',
                      type: 'pending',
                      value: '{expression}',
                      isActive: true
                  }
              ] as PendingPropertyChange[])
            : [],
        saved: saved
            ? ([
                  {
                      controlId: 'testId2',
                      controlName: 'controlName2',
                      propertyName: 'testPropertyName2',
                      type: 'saved',
                      value: 'testValue2',
                      fileName: 'testFileName',
                      kind: 'valid',
                      timestamp: new Date('2022-02-09T12:06:53.939Z').getTime()
                  },
                  {
                      controlId: 'testId3',
                      controlName: 'controlNameBoolean',
                      propertyName: 'testPropertyNameBool',
                      type: 'saved',
                      value: true,
                      fileName: 'testFileNameBool',
                      kind: 'valid',
                      timestamp: new Date('2022-02-09T12:06:53.939Z').getTime()
                  },
                  {
                      controlId: 'testId4',
                      controlName: 'controlNameNumber',
                      propertyName: 'testPropertyNameNum',
                      type: 'saved',
                      value: 2,
                      fileName: 'testFileNameNum',
                      kind: 'valid',
                      timestamp: new Date('2022-02-09T12:06:53.939Z').getTime()
                  }
              ] as SavedPropertyChange[])
            : []
    };
    return model;
};
const filterInitOptions: FilterOptions[] = [{ name: FilterName.changeSummaryFilterQuery, value: '' }];
describe('ChangePanel', () => {
    beforeAll(() => {
        initI18n();
        initIcons();
        registerAppIcons();
    });
    test('ChangePanel empty save and pending', () => {
        const model = getEmptyModel();
        const initialState: State = {
            deviceType: DeviceType.Desktop,
            scale: 1,
            outline: {} as any,
            filterQuery: filterInitOptions,
            selectedControl: undefined,
            changes: model,
            icons: []
        };
        render(<ChangesPanel />, { initialState });

        // check no controls found
        const noControlFound = screen.getByText(/no control changes found/i);
        expect(noControlFound).toBeInTheDocument();
    });

    test('ChangePanel with unsaved changes', () => {
        const model = getModel();
        const initialState: State = {
            deviceType: DeviceType.Desktop,
            scale: 1,
            outline: {} as any,
            filterQuery: filterInitOptions,
            selectedControl: undefined,
            changes: model,
            icons: []
        };
        render(<ChangesPanel />, { initialState });

        // check unsaved changes
        const unsavedChangesTitle = screen.getByText(/unsaved changes/i);
        expect(unsavedChangesTitle).toBeInTheDocument();

        const controlName = screen.getByRole('button', { name: /Control Name1/i });
        expect(controlName).toBeInTheDocument();

        const propertyName = screen.getByText(/Test Property Name1/i);
        expect(propertyName).toBeInTheDocument();

        const value = screen.getByText(/testValue1/i);
        expect(value).toBeInTheDocument();
    });

    test('ChangePanel with saved changes', () => {
        const model = getModel(true);
        const initialState: State = {
            deviceType: DeviceType.Desktop,
            scale: 1,
            outline: {} as any,
            filterQuery: filterInitOptions,
            selectedControl: undefined,
            changes: model,
            icons: []
        };
        render(<ChangesPanel />, { initialState });

        // check saved changes
        const savedChangesTitle = screen.getByText(/saved changes/i);
        expect(savedChangesTitle).toBeInTheDocument();

        const controlName1 = screen.getByRole('button', { name: /control name2/i });
        expect(controlName1).toBeInTheDocument();
        fireEvent.click(controlName1);

        const propertyName1 = screen.getByText(/Test Property Name2/i);
        expect(propertyName1).toBeInTheDocument();

        const value1 = screen.getByText(/testValue2/i);
        expect(value1).toBeInTheDocument();

        const deleteButton = screen.getAllByRole('button')[1];
        const iTagAttributes = deleteButton?.children?.item(0)?.children?.item(0)?.attributes;
        const iconName = iTagAttributes?.getNamedItem('data-icon-name')?.value;

        expect(deleteButton).toBeInTheDocument();
        expect(iconName).toBe('TrashCan');

        fireEvent.click(deleteButton);
        expect(
            screen.getByText(
                /Are you sure you want to delete the change for this property\? This action cannot be undone\./i
            )
        ).toBeInTheDocument();

        // first cancel
        const cancelButton = screen.getByRole('button', { name: /^Cancel$/i });
        cancelButton.click();

        // delete
        fireEvent.click(deleteButton);
        const confirmButton = screen.getByRole('button', { name: /^Delete$/i });
        confirmButton.click();

        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'control Name2' } });

        const controlName2 = screen.getByRole('button', { name: /control name2/i });
        expect(controlName2).toBeInTheDocument();

        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'yyyyy' } });

        expect(screen.queryByText(/Test Property Name1/i)).toStrictEqual(null);
        expect(screen.queryByText(/Test Property Name2/i)).toStrictEqual(null);
    });

    test('ChangePanel with unknown saved changes', () => {
        const model: ChangesSlice = {
            controls: {} as any,
            pending: [],
            saved: [
                {
                    fileName: 'testFileName2',
                    type: 'saved',
                    kind: 'unknown'
                } as any
            ]
        };
        const initialState: State = {
            deviceType: DeviceType.Desktop,
            scale: 1,
            outline: {} as any,
            filterQuery: filterInitOptions,
            selectedControl: undefined,
            changes: model,
            icons: []
        };
        render(<ChangesPanel />, { initialState });

        // check unknown changes
        const savedChangesTitle = screen.getByText(/saved changes/i);
        expect(savedChangesTitle).toBeInTheDocument();

        const title = screen.getByText(/Test File Name2/i);
        expect(title).toBeInTheDocument();

        const value = screen.getByText(/File: testFileName2/i);
        expect(value).toBeInTheDocument();

        const deleteButton = screen.getAllByRole('button')[0];
        const iTagAttributes = deleteButton?.children?.item(0)?.children?.item(0)?.attributes;
        const iconName = iTagAttributes?.getNamedItem('data-icon-name')?.value;
        expect(deleteButton).toBeInTheDocument();
        expect(iconName).toBe('TrashCan');

        fireEvent.click(deleteButton);
        expect(
            screen.getByText(
                /Are you sure you want to delete the change for this property\? This action cannot be undone\./i
            )
        ).toBeInTheDocument();

        // first cancel
        const cancelButton = screen.getByRole('button', { name: /^Cancel$/i });
        cancelButton.click();

        // delete
        fireEvent.click(deleteButton);
        const confirmButton = screen.getByRole('button', { name: /^Delete$/i });
        confirmButton.click();
    });
});