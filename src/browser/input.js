/* @flow */

import {html, forward, Effects} from 'reflex';
import {on, focus, selection} from 'driver';
import {identity} from '../lang/functional';
import {always, merge} from '../common/prelude';
import {cursor} from "../common/cursor";
import {compose} from '../lang/functional';
import * as Focusable from '../common/focusable';
import * as Editable from '../common/editable';
import * as Keyboard from '../common/keyboard';
import * as Unknown from '../common/unknown';
import {Style, StyleSheet} from '../common/style';


/*:: import * as type from '../../type/browser/input' */

export const initial/*:type.Model*/ =
  { value: ''
  , isFocused: false
  , selection: null
  , isVisible: false
  };

// Create a new input submit action.
export const Submit/*:type.Submit*/ = {type: 'Submit'};
export const Abort/*:type.Abort*/ = {type: 'Abort'};
export const Enter/*:type.Enter*/ = {type: 'Enter'};
export const Focus = Focusable.Focus;
export const Show = {type: 'Show'};
export const Hide = {type: 'Hide'};
export const EnterSelection = value => ({type: 'EnterSelection', value});

const FocusableAction = action =>
    action.type === 'Focus'
  ? Focus
  : {type: 'Focusable', action};

const EditableAction = action => ({type: 'Editable', action});

export const Blur = FocusableAction(Focusable.Blur);

const updateFocusable = cursor({
  tag: FocusableAction,
  update: Focusable.update
});

const updateEditable = cursor({
  tag: EditableAction,
  update: Editable.update
});

const enter = (model) => {
  const [next, focusFx] = updateFocusable(model, Focusable.Focus);
  const [result, editFx] = updateEditable(next, Editable.Clear);
  return [result, Effects.batch([focusFx, editFx])];
}

const enterSelection = (model, value) => {
  const [next, focusFx] = updateFocusable(model, Focusable.Focus);
  const [result, editFx] = updateEditable(next, Editable.Change({
    value,
    selection: {start: 0, end: value.length, direction: 'forward'}
  }));
  return [result, Effects.batch([focusFx, editFx])];
}

export const init = (isVisible=false, isFocused=false, value='') =>
  [ ({value
    , isFocused
    , isVisible
    , selection: null
    })
  , Effects.none
  ];

export const update = (model, action) =>
    action.type === 'Keyboard.Command'
  ? update(model, action.action)
  : action.type === 'Abort'
  ? updateFocusable(model, Focusable.Blur)
  : action.type === 'Enter'
  ? enter(merge(model, {isVisible: true}))
  : action.type === Focus.type
  ? updateFocusable
    ( merge(model, {isFocused: true, isVisible: true})
    , Focusable.Focus
    )
  : action.type === 'EnterSelection'
  ? enterSelection(merge(model, {isVisible: true}), action.value)
  : action.type === 'Focusable'
  ? updateFocusable(model, action.action)
  : action.type === 'Editable'
  ? updateEditable(model, action.action)
  : action.type === 'Show'
  ? [merge(model, {isVisible: true}), Effects.none]
  : action.type === 'Hide'
  ? [merge(model, {isVisible: false}), Effects.none]
  : Unknown.update(model, action)


const decodeKeyDown = Keyboard.bindings({
  // 'up': _ => Suggestions.SelectPrevious(),
  // 'control p': _ => Suggestions.SelectPrevious(),
  // 'down': _ => Suggestions.SelectNext(),
  // 'control n': _ => Suggestions.SelectNext(),
  'enter': always(Submit),
  'escape': always(Abort)
});

// Read a selection model from an event target.
// @TODO type signature
const readSelection = target => ({
  start: target.selectionStart,
  end: target.selectionEnd,
  direction: target.selectionDirection
});

// Read change action from a dom event.
// @TODO type signature
const readChange = compose
  ( EditableAction
  , ({target}) =>
      Editable.Change(target.value, readSelection(target))
  );

// Read select action from a dom event.
// @TODO type signature
const readSelect = compose
  ( EditableAction
  , ({target}) =>
      Editable.Select(readSelection(target))
  );

const inputWidth = '460px';
const inputHeight = '40px';

const style = StyleSheet.create({
  combobox: {
    background: '#EBEEF2',
    borderRadius: '5px',
    height: inputHeight,
    left: '50%',
    marginLeft: `calc(-1 * (${inputWidth} / 2))`,
    position: 'absolute',
    padding: '0 32px',
    top: '40px',
    width: `calc(${inputWidth} - ${32 * 2}px)`
  },
  field: {
    background: 'transparent',
    borderWidth: 0,
    display: 'block',
    fontSize: '14px',
    MozAppearance: 'none',
    height: inputHeight,
    lineHeight: inputHeight,
    margin: 0,
    padding: 0,
    width: `calc(${inputWidth} - ${32 * 2}px)`
  },
  inactive: {
    opacity: 0,
    pointerEvents: 'none'
  },
  searchIcon: {
    color: 'rgba(0,0,0,0.5)',
    fontFamily: 'FontAwesome',
    fontSize: '16px',
    left: '10px',
    lineHeight: '40px',
    position: 'absolute',
    top: 0
  },
  clearIcon: {
    color: 'rgba(0,0,0,0.5)',
    fontFamily: 'FontAwesome',
    fontSize: '16px',
    right: '10px',
    lineHeight: '40px',
    position: 'absolute'
  },
  clearIconInactive: {
    opacity: 0
  },
  visible: {

  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none'
  }
});

export const view = (model, address) =>
  html.div({
    className: 'input-combobox',
    style: Style( style.combobox
                ,   model.isVisible
                  ? style.visible
                  : style.hidden
                )
  }, [
    html.span({
      className: 'input-search-icon',
      style: style.searchIcon
    }, ['']),
    html.span({
      className: 'input-clear-icon',
      style: Style(
        style.clearIcon,
        model.value === '' && style.clearIconInactive
      ),
      onClick: () => address(Editable.Clear)
    }, ['']),
    html.input({
      className: 'input-field',
      placeholder: 'Search or enter address',
      style: style.field,
      type: 'text',
      value: model.value,
      isFocused: focus(model.isFocused),
      selection: selection(model.selection),
      onInput: on(address, readChange),
      onSelect: on(address, readSelect),
      onFocus: on(address, always(Focus)),
      onBlur: on(address, always(Blur)),
      onKeyDown: on(address, decodeKeyDown),
      // DOM does not fire selection events when you hit arrow
      // keys or when you click in the input field. There for we
      // need to handle those events to keep our model in sync with
      // actul input field state.

      // @HACK In servo input event does not seem to fire as expected
      // so we use onKeyUp instead here.
      onKeyUp: on(address, readChange),
      onMouseOut: on(address, readSelect)
    })
  ]);
