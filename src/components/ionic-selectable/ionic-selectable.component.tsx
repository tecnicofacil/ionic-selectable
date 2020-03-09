import {
  Component,
  Prop,
  h,
  Host,
  ComponentInterface,
  Element,
  Event,
  EventEmitter,
  Watch,
  Method,
  State
} from '@stencil/core';
import { CssClassMap, getMode, modalController, StyleEventDetail, ModalOptions, AnimationBuilder } from '@ionic/core';
import { hostContext, addRippleEffectElement, findItem, findItemLabel, renderHiddenInput } from '../../utils/utils';
import { IIonicSelectableEvent } from './ionic-selectable.interfaces.component';
import { IonicSelectableModalComponent } from '../ionic-selectable-modal/ionic-selectable-modal.component';

/**
 * @virtualProp {"ios" | "md"} mode - The mode determines which platform styles to use.
 *
 * @part placeholder - The text displayed in the select when there is no value.
 * @part text - The displayed value of the select.
 * @part icon - The select icon container.
 * @part icon-inner - The select icon.
 */
@Component({
  tag: 'ionic-selectable',
  styleUrls: {
    ios: 'ionic-selectable.ios.component.scss',
    md: 'ionic-selectable.md.component.scss'
  },
  shadow: true
})
export class IonicSelectableComponent implements ComponentInterface {
  @Element() private element!: HTMLIonicSelectableElement;
  private id = this.element.id ? this.element.id : `ionic-selectable-${nextId++}`;
  private isInited = false;
  private buttonElement?: HTMLButtonElement;

  private modalElement!: HTMLIonModalElement;

  private isChangeInternal = false;

  private groups: Array<{ value: string; text: string; items: any[] }> = [];

  public selectableModalComponent!: IonicSelectableModalComponent;

  public filteredGroups: Array<{ value: string; text: string; items: any[] }> = [];
  public hasFilteredItems = false;
  public hasObjects = false;
  public hasGroups = false;
  public footerButtonsCount = 0;

  @State() public selectedItems: any[] = [];
  @State() private valueItems: any[] = [];
  @State() private itemsToConfirm: any[] = [];
  /**
   * Determines whether Modal is opened.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#isopened).
   *
   * @default false
   * @readonly
   * @memberof IonicSelectableComponent
   */
  @Prop() public isOpened = false;

  /**
   * Determines whether the component is disabled.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#isdisabled).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop() public isDisabled = false;

  /**
   * A placeholder.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#placeholder).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop() public placeholder?: string | null;

  /**
   * Close button text.
   * The field is only applicable to **iOS** platform, on **Android** only Cross icon is displayed.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#closebuttontext).
   *
   * @default 'Cancel'
   * @memberof IonicSelectableComponent
   */
  @Prop() public closeButtonText = 'Cancel';

  /**
   * Close button slot. [Ionic slots](https://ionicframework.com/docs/api/buttons) are supported.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#closebuttonslot).
   *
   * @default 'start'
   * @memberof IonicSelectableComponent
   */
  @Prop() public closeButtonSlot = 'start';

  /**
   * Item icon slot. [Ionic slots](https://ionicframework.com/docs/api/item) are supported.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#itemiconslot).
   *
   * @default 'start'
   * @memberof IonicSelectableComponent
   */
  @Prop() public itemIconSlot = 'start';

  /**
   * Confirm button text.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#confirmbuttontext).
   *
   * @default 'OK'
   * @memberof IonicSelectableComponent
   */
  @Prop() public confirmButtonText = 'OK';

  /**
   * Clear button text.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#clearbuttontext).
   *
   * @default 'Clear'
   * @memberof IonicSelectableComponent
   */
  @Prop() public clearButtonText = 'Clear';

  /**
   * Add button text.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#addbuttontext).
   *
   * @default 'Add'
   * @memberof IonicSelectableComponent
   */
  @Prop() public addButtonText = 'Add';

  /**
   * The name of the control, which is submitted with the form data.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#name).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop() public name: string = this.id;

  /**
   * Determines whether multiple items can be selected.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#selectedText).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop() public selectedText?: string | null;

  /**
   * Determines whether multiple items can be selected.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#ismultiple).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop() public isMultiple = false;

  /**
   * The value of the component.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#value).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public value?: any | null = null;

  /**
   * Is set to true, the value will be extracted from the itemValueField of the objects.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#shouldStoreItemValue).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop() public shouldStoreItemValue?: boolean = false;

  /**
   * A list of items.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#items).
   *
   * @default []
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public items: any[] = [];

  /**
   * A list of items to disable.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#disableditems).
   *
   * @default []
   * @memberof IonicSelectableComponent
   */
  @Prop() public disabledItems: any[] = [];

  /**
   * Item property to use as a unique identifier, e.g, `'id'`.
   * **Note**: `items` should be an object array.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#itemvaluefield).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop() public itemValueField: string = null;

  /**
   * Item property to display, e.g, `'name'`.
   * **Note**: `items` should be an object array.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#itemtextfield).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop() public itemTextField: string = null;

  /**
   * Determines whether Modal should be closed when backdrop is clicked.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#shouldbackdropclose).
   *
   * @default true
   * @memberof IonicSelectableComponent
   */
  @Prop() public shouldBackdropClose: boolean;

  /**
   * Modal CSS class.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#modalcssclass).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop() public modalCssClass: string = null;

  /**
   * Modal enter animation.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#modalenteranimation).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop() public modalEnterAnimation: AnimationBuilder = null;

  /**
   * Modal leave animation.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#modalleaveanimation).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop() public modalLeaveAnimation: AnimationBuilder = null;

  /**
   * Text of [Ionic Label](https://ionicframework.com/docs/api/label).
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#label).
   *
   * @readonly
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop() public titleText: string = null;

  /**
   *
   * Group property to use as a unique identifier to group items, e.g. `'country.id'`.
   * **Note**: `items` should be an object array.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#groupvaluefield).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop() public groupValueField: string = null;

  /**
   * Group property to display, e.g. `'country.name'`.
   * **Note**: `items` should be an object array.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#grouptextfield).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop() public groupTextField: string = null;

  /**
   * Determines whether Ionic [InfiniteScroll](https://ionicframework.com/docs/api/infinite-scroll) is enabled.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#hasinfinitescroll).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop() public hasInfiniteScroll = false;

  /**
   * The threshold distance from the bottom of the content to call the infinite output event when scrolled.
   * Use the value 100px when the scroll is within 100 pixels from the bottom of the page.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#infinite-scroll).
   *
   * @default '100px'
   * @memberof IonicSelectableComponent
   */
  @Prop() public infiniteScrollThreshold = '100px';

  /**
   * Determines whether Ionic [VirtualScroll](https://ionicframework.com/docs/api/virtual-scroll) is enabled.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#hasvirtualscroll).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop() public hasVirtualScroll = false;

  /**
   * See Ionic VirtualScroll [approxHeaderHeight](https://ionicframework.com/docs/api/virtual-scroll).
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#virtualscrollheaderfn).
   *
   * @default 30
   * @memberof IonicSelectableComponent
   */
  @Prop() public virtualScrollApproxHeaderHeight = 30;

  /**
   * See Ionic VirtualScroll [approxItemHeight](https://ionicframework.com/docs/api/virtual-scroll).
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#virtualscrollheaderfn).
   *
   * @default 45
   * @memberof IonicSelectableComponent
   */
  @Prop() public virtualScrollApproxItemHeight = 45;

  /**
   * Determines whether Confirm button is visible for single selection.
   * By default Confirm button is visible only for multiple selection.
   * **Note**: It is always true for multiple selection and cannot be changed.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#hasconfirmbutton).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop() public hasConfirmButton: boolean = false;

  /**
   * Determines whether to allow adding items.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#canadditem).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop() public canAddItem: boolean = false;

  /**
   * Determines whether to show Clear button.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#canclear).
   * @default false
   * @memberof IonicSelectableComponent
   */
  // Pending - @HostBinding('class.ionic-selectable-can-clear')
  @Prop() public canClear: boolean = false;

  /**
   * Determines whether to show [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#cansearch).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop() public canSearch = false;

  /**
   * Determines the search is delegate to event, and not handled internally.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#cansearch).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop() public shouldDelegateSearchToEvent = false;

  /**
   * How long, in milliseconds, to wait to filter items or to trigger `onSearch` event after each keystroke.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#searchdebounce).
   *
   * @default 250
   * @memberof IonicSelectableComponent
   */
  @Prop() public searchDebounce: number = 250;

  /**
   * A placeholder for [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#searchplaceholder).
   *
   * @default 'Search'
   * @memberof IonicSelectableComponent
   */
  @Prop() public searchPlaceholder = 'Search';

  /**
   * Text in [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#searchtext).
   *
   * @default ''
   * @memberof IonicSelectableComponent
   */
  @Prop() public searchText = '';

  /**
   * Text to display when no items have been found during search.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#searchfailtext).
   *
   * @default 'No items found.'
   * @memberof IonicSelectableComponent
   */
  @Prop() public searchFailText = 'No items found.';

  /**
   * Determines whether Searchbar should receive focus when Modal is opened.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#shouldfocussearchbar).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop() public shouldFocusSearchbar = false;

  /**
   * Determines whether user has typed anything in [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#hassearchtext).
   *
   * @default false
   * @readonly
   * @memberof IonicSelectableComponent
   */
  @Prop() public hasSearchText: boolean;

  /**
   * Set the cancel button icon of the [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * Only applies to md mode. Defaults to "arrow-back-sharp".
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#hassearchtext).
   *
   * @default 'arrow-back-sharp'
   * @memberof IonicSelectableComponent
   */
  @Prop() public searchCancelButtonIcon: string = 'arrow-back-sharp';

  /**
   * Set the the cancel button text of the [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * Only applies to ios mode.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#hassearchtext).
   *
   * @default 'Cancel'
   * @memberof IonicSelectableComponent
   */
  @Prop() public searchCancelButtonText: string = 'Cancel';

  /**
   * Set the clear icon of the [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * Defaults to "close-circle" for ios and "close-sharp" for md.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#hassearchtext).
   *
   * @memberof IonicSelectableComponent
   */
  @Prop() public searchClearIcon: string = getMode() === 'ios' ? 'close-circle' : 'close-sharp';

  /**
   * A hint to the browser for which keyboard to display.
   * Possible values: "none", "text", "tel", "url", "email", "numeric", "decimal", and "search".
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#hassearchtext).
   * @default 'none'
   * @memberof IonicSelectableComponent
   */
  @Prop() public searchInputmode: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search' = 'none';

  /**
   * The icon to use as the search icon in the [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * Defaults to "search-outline" in ios mode and "search-sharp" in md mode.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#hassearchtext).
   * @default 'none'
   * @memberof IonicSelectableComponent
   */
  @Prop() public searchIcon: string = getMode() === 'ios' ? 'search-outline' : 'search-sharp';

  /**
   * Sets the behavior for the cancel button of the [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * Defaults to "never".
   * Setting to "focus" shows the cancel button on focus.
   * Setting to "never" hides the cancel button.
   * Setting to "always" shows the cancel button regardless of focus state.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#hassearchtext).
   * @default 'none'
   * @memberof IonicSelectableComponent
   */
  @Prop() public searchShowCancelButton: 'always' | 'focus' | 'never' = 'never';

  /**
   * Determines whether Confirm button is enabled.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#isconfirmbuttonenabled).
   *
   * @default true
   * @memberof IonicSelectableComponent
   */
  @Prop() public isConfirmButtonEnabled: boolean = true;

  /**
   * Header color. [Ionic colors](https://ionicframework.com/docs/theming/advanced#colors) are supported.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#headercolor).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop() public headerColor: string = null;

  /**
   * Group color. [Ionic colors](https://ionicframework.com/docs/theming/advanced#colors) are supported.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#groupcolor).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop() public groupColor: string = null;

  /**
   * Fires when the user has scrolled to the end of the list.
   * **Note**: `hasInfiniteScroll` has to be enabled.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#oninfinitescroll).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public infiniteScroll: EventEmitter<IIonicSelectableEvent>;

  /**
   * Fires when the user is typing in Searchbar.
   * **Note**: `canSearch` and `shouldDelegateSearchToEvent` has to be enabled.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#onsearch).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public search: EventEmitter<IIonicSelectableEvent>;

  /**
   * Fires when no items have been found.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#onsearchfail).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public searchFailed: EventEmitter<IIonicSelectableEvent>;

  /**
   * Fires when some items have been found.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#onsearchsuccess).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public searchSuccessed: EventEmitter<IIonicSelectableEvent>;

  /**
   * Fires when Add item button has been clicked.
   * When the button has been clicked `ionicSelectableAddItemTemplate` will be shown. Use the template to create
   * a form to add item.
   * **Note**: `canAddItem` has to be enabled.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#onadditem).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public addItem: EventEmitter<IIonicSelectableEvent>;

  /**
   * Fires when Clear button has been clicked.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#onclear).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public cleared: EventEmitter<IIonicSelectableEvent>;

  /**
   * Fires when item/s has been selected and Modal closed.
   * if isMultiple is set to true 'value' is an array else is a object
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#onChanged).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public changed!: EventEmitter<IIonicSelectableEvent>;

  /**
   * Fires when an item has been selected or unselected.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#onselect).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public selected: EventEmitter<IIonicSelectableEvent>;

  /**
   * Fires when Modal has been opened.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#onopen).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public opened: EventEmitter<IIonicSelectableEvent>;

  /**
   * Fires when Modal has been closed.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#onclose).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public closed: EventEmitter<IIonicSelectableEvent>;

  /**
   * Fires when has focus
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#onFocused).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public focused!: EventEmitter<IIonicSelectableEvent>;

  /**
   * Fires when loses focus.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#onBlurred).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public blurred!: EventEmitter<IIonicSelectableEvent>;

  /**
   * Emitted when the styles change.
   * @internal
   */
  @Event() public ionStyle!: EventEmitter<StyleEventDetail>;

  /**
   * See Ionic VirtualScroll [headerFn](https://ionicframework.com/docs/api/virtual-scroll).
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#virtualscrollheaderfn).
   *
   * @memberof IonicSelectableComponent
   */
  @Prop() public virtualScrollHeaderFn = () => null;

  @Watch('shouldStoreItemValue')
  protected shouldStoreItemValueChanged(value: boolean): void {
    if (!value && !this.hasObjects) {
      throw new Error(
        `If items contains primitive elements, shouldStoreItemValue must be null or true: ${this.element.id}`
      );
    }
  }

  @Watch('itemValueField')
  protected itemValueFieldChanged(value: string): void {
    if (this.hasObjects && this.isNullOrWhiteSpace(value)) {
      throw new Error(
        `If items contains object elements, itemValueField must be non null or non whitespace : ${this.element.id}`
      );
    } else if (!this.hasObjects && !this.isNullOrWhiteSpace(value)) {
      throw new Error(`If items contains primitive elements, itemValueField must be null: ${this.element.id}`);
    }
  }

  @Watch('itemTextField')
  protected itemTextFieldChanged(value: string): void {
    if (this.hasObjects && this.isNullOrWhiteSpace(value)) {
      throw new Error(
        `If items contains object elements, itemTextField must be non null or non whitespace : ${this.element.id}`
      );
    } else if (!this.hasObjects && !this.isNullOrWhiteSpace(value)) {
      throw new Error(`If items contains primitive elements, itemTextField must be null: ${this.element.id}`);
    }
  }

  @Watch('items')
  protected itemsChanged(value: []): void {
    this.setItems(value);
  }

  @Watch('isDisabled')
  @Watch('placeholder')
  protected disabledChanged(): void {
    this.emitStyle();
  }

  @Watch('value')
  protected valueChanged(newValue: any | any[]): void {
    if (!this.isChangeInternal) {
      this.emitStyle();
      if (this.isInited) {
        this.setValue(newValue, false);
      }
    }
    this.isChangeInternal = false;
  }

  @Watch('searchText')
  protected searchTextChanged(newValue: string): void {
    if (!this.isChangeInternal) {
      if (this.isOpened) {
        this.filterItems(newValue, false);
      }
    }
    this.isChangeInternal = false;
  }

  @Watch('isMultiple')
  @Watch('canClear')
  @Watch('canAddItem')
  @Watch('hasConfirmButton')
  protected isMultipleChanged(): void {
    this.countFooterButtons();
  }

  @Watch('disabledItems')
  protected disabledItemsChanged(): void {
    this.selectableModalComponent?.update();
  }

  public async connectedCallback(): Promise<void> {
    this.emitStyle();
  }

  public componentWillLoad(): void {
    this.setItems(this.items);
    this.setValue(this.value);
    this.countFooterButtons();
    this.isInited = true;
  }

  /**
   * Determines whether any item has been selected.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#hasvalue).
   *
   * @returns A boolean determining whether any item has been selected.
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async hasValue(): Promise<boolean> {
    return this.parseValue() !== '';
  }

  /**
   * Opens Modal.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#open).
   *
   * @returns Promise that resolves when Modal has been opened.
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async open(): Promise<void> {
    if (this.isDisabled || this.isOpened) {
      return Promise.reject(`IonicSelectable is disabled or already opened: ${this.element.id}`);
    }

    const label = findItemLabel(this.element);
    if (label && !this.titleText) {
      this.titleText = label.textContent;
    }

    const modalOptions: ModalOptions = {
      component: 'ionic-selectable-modal',
      componentProps: { selectableComponent: this },
      backdropDismiss: this.shouldBackdropClose
    };

    if (this.modalCssClass) {
      modalOptions.cssClass = this.modalCssClass;
    }

    if (this.modalEnterAnimation) {
      modalOptions.enterAnimation = this.modalEnterAnimation;
    }

    if (this.modalLeaveAnimation) {
      modalOptions.leaveAnimation = this.modalLeaveAnimation;
    }
    this.filterItems(this.searchText);
    this.modalElement = await modalController.create(modalOptions);
    await this.modalElement.present();
    this.isOpened = true;
    this.setFocus();
    this.whatchModalEvents();
    this.emitOpened();
    return Promise.resolve();
  }

  /**
   * Closes Modal.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#close).
   *
   * @returns Promise that resolves when Modal has been closed.
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async close(): Promise<void> {
    if (this.isDisabled || !this.isOpened) {
      return Promise.reject(`IonicSelectable is disabled or already closed: ${this.element.id}`);
    }

    await this.modalElement.dismiss();
    // Pending - self._itemToAdd = null;
    // Pending - self.hideAddItemTemplate();

    if (!this.shouldDelegateSearchToEvent) {
      this.setHasSearchText('');
    }

    this.emitClosed();

    return Promise.resolve();
  }

  /**
   * Return a list of items that are selected and awaiting confirmation by user, when he has clicked Confirm button.
   * After the user has clicked Confirm button items to confirm are cleared.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#itemstoconfirm).
   *
   * @returns a promise whit de list of items that are selected and awaiting confirmation by user
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async getItemsToConfirm(): Promise<any[]> {
    return this.itemsToConfirm;
  }

  /**
   * Confirms selected items by updating value.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#confirm).
   *
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async confirm(): Promise<void> {
    if (this.isMultiple) {
      this.setValue(this.selectedItems);
    } else if (this.hasConfirmButton /* || this.footerTemplate */) {
      this.setValue(this.selectedItems[0] || null);
    }
  }

  /**
   * Clears value.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#clear).
   *
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async clear(): Promise<void> {
    this.clearItems();
  }

  /**
   * Enables infinite scroll.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#enableinfinitescroll).
   *
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async enableInfiniteScroll(): Promise<void> {
    if (!this.hasInfiniteScroll) {
      return;
    }

    this.selectableModalComponent.infiniteScrollElement.disabled = false;
  }

  /**
   * Disables infinite scroll.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#disableinfinitescroll).
   *
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async disableInfiniteScroll(): Promise<void> {
    if (!this.hasInfiniteScroll) {
      return;
    }

    this.selectableModalComponent.infiniteScrollElement.disabled = true;
  }

  /**
   * Ends infinite scroll.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#endinfinitescroll).
   *
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async endInfiniteScroll(): Promise<void> {
    if (!this.hasInfiniteScroll) {
      return;
    }
    this.selectableModalComponent.infiniteScrollElement.complete();
    if (this.hasVirtualScroll) {
      // Rerender Virtual Scroll List After Adding New Data
      this.selectableModalComponent.virtualScrollElement.checkEnd();
    }
    this.setItems(this.items);
  }

  /**
   * Scrolls to the top of Modal content.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#scrolltotop).
   *
   * @returns Promise that resolves when scroll has been completed.
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async scrollToTop(): Promise<any> {
    if (!this.isOpened) {
      return Promise.reject(`IonicSelectable content cannot be scrolled: ${this.element.id}`);
    }
    await this.selectableModalComponent.contentElement.scrollToTop();
    return Promise.resolve();
  }

  /**
   * Scrolls to the bottom of Modal content.
   * See more on [GitHub](https://github.com/eakoriakin/ionic-selectable/wiki/Documentation#scrolltobottom).
   *
   * @returns Promise that resolves when scroll has been completed.
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async scrollToBottom(): Promise<any> {
    if (!this.isOpened) {
      return Promise.reject(`IonicSelectable content cannot be scrolled: ${this.element.id}`);
    }
    await this.selectableModalComponent.contentElement.scrollToBottom();
    return Promise.resolve();
  }

  public clearItems(): void {
    this.emitCleared();
    this.selectedItems = [];
    this.itemsToConfirm = [];
    this.selectableModalComponent?.update();
  }

  public closeModal(): void {
    this.close();
  }

  public addItemClick(): void {
    if (true /* this._hasOnAddItem() */) {
      this.emitAddItem();
    } else {
      // Pending - this.showAddItemTemplate();
    }
  }

  public onSearchbarValueChanged(event: CustomEvent): void {
    this.filterItems(event.detail.value);
  }

  public isItemSelected(item: any): boolean {
    return this.generateText(this.selectedItems, item, this.itemValueField) !== '';
  }

  public isItemDisabled(item: any): boolean {
    if (!this.disabledItems) {
      return;
    }

    return this.disabledItems.some((_item) => {
      return this.getItemValue(_item) === this.getItemValue(item);
    });
  }

  public selectItem(item: any): void {
    const isItemSelected = this.isItemSelected(item);
    if (this.isMultiple) {
      if (isItemSelected) {
        this.deleteSelectedItem(item);
      } else {
        this.addSelectedItem(item);
      }

      this.itemsToConfirm = [...this.selectedItems];

      // Emit onSelect event after setting items to confirm so they could be used inside the event.
      this.emitSelected(item, !isItemSelected);
    } else {
      if (this.hasConfirmButton /* || this.footerTemplate*/) {
        // Don't close Modal and keep track on items to confirm.
        // When footer template is used it's up to developer to close Modal.
        this.selectedItems = [];

        if (isItemSelected) {
          this.deleteSelectedItem(item);
        } else {
          this.addSelectedItem(item);
        }

        this.itemsToConfirm = [...this.selectedItems];

        // Emit onSelect event after setting items to confirm so they could be used inside the event.
        this.emitSelected(item, !isItemSelected);
      } else {
        const isItemValue = this.isItemValue(item);
        if (!isItemValue) {
          this.selectedItems = [];
          this.addSelectedItem(item);

          // Emit onSelect before onChange.
          this.emitSelected(item, true);

          this.setValue(item);
        }

        this.close();
      }
    }
  }

  public confirmSelection(): void {
    this.confirm();
    this.close();
  }

  public getMoreItems(): void {
    this.emitIonInfinite();
  }

  private setValue(value: any | any[], isChangeInternal = true): void {
    this.isChangeInternal = isChangeInternal;
    if (value) {
      // If type is string convert to object
      value = typeof value === 'string' ? JSON.parse((value as string).replace(/\'/gi, '"')) : value;
      const isArray = Array.isArray(value);
      if (!isArray) {
        value = [value];
      }

      if (this.isMultiple && !isArray) {
        throw new Error(`If isMultiple is set to true, value must be array: ${this.element.id}`);
      }
      if (!this.isMultiple && isArray) {
        throw new Error(`If isMultiple is set to false, value must be object: ${this.element.id}`);
      }
      this.valueItems = [];
      (value as []).forEach((val) => {
        if (this.shouldStoreItemValue && typeof val === 'object') {
          throw new Error(`If shouldStoreItemValue is set to true, value must be primitive: ${this.element.id}`);
        } else if (!this.shouldStoreItemValue && typeof val !== 'object') {
          throw new Error(`If shouldStoreItemValue is set to false, value must be object: ${this.element.id}`);
        }
        const key = typeof val === 'object' ? val[this.itemValueField] : val;
        this.valueItems.push(
          this.getItemValue(
            this.hasObjects
              ? this.items.find((item) => item[this.itemValueField] === key)
              : this.items.find((item) => item === key)
          )
        );
      });
      if (!this.isMultiple) {
        this.valueItems = (this.valueItems as []).pop();
        this.selectedItems = [this.valueItems];
      } else {
        this.selectedItems = [...this.valueItems];
      }
      if (this.isChangeInternal) {
        this.value = this.valueItems;
      }
    } else {
      this.valueItems = [];
      this.selectedItems = [];
      if (this.isChangeInternal) {
        this.value = this.isMultiple ? [] : null;
      }
    }
    this.itemsToConfirm = [];
    if (this.isOpened) {
      this.selectableModalComponent?.update();
    }
    if (this.isInited) {
      this.emitChanged();
    }
  }

  private setItems(items: any[]): void {
    if (!Array.isArray(items)) {
      throw new Error(`items must be array: ${this.element.id}`);
    }

    this.items.forEach((item) => {
      if (typeof item === 'object') {
        this.hasObjects = true;
      }
    });

    // If items contains primitive elements, isValuePrimitive is set to true
    if (!this.hasObjects) {
      this.shouldStoreItemValue = true;
    }

    this.itemValueFieldChanged(this.itemValueField);
    this.itemTextFieldChanged(this.itemTextField);
    this.shouldStoreItemValueChanged(this.shouldStoreItemValue);

    // Grouping is supported for objects only.
    // Ionic VirtualScroll has it's own implementation of grouping.
    this.hasGroups = Boolean(
      this.hasObjects && (this.groupValueField || this.groupTextField) && !this.hasVirtualScroll
    );

    /* It's important to have an empty starting group with empty items (groups[0].items),
     * because we bind to it when using VirtualScroll.
     * See https://github.com/eakoriakin/ionic-selectable/issues/70.
     */
    let groups: any[] = [
      {
        items: items || []
      }
    ];
    if (items && items.length) {
      if (this.hasGroups) {
        groups = [];

        items.forEach((item) => {
          const groupValue = this.generateText(this.items, item, this.groupValueField || this.groupTextField);
          const group = groups.find((_group) => _group.value === groupValue);

          if (group) {
            group.items.push(item);
          } else {
            groups.push({
              value: groupValue,
              text: this.generateText(this.items, item, this.groupTextField),
              items: [item]
            });
          }
        });
      }
    }
    this.groups = groups;
    this.filteredGroups = this.groups;
    this.hasFilteredItems = !this.areGroupsEmpty(this.filteredGroups);
    this.selectableModalComponent?.update();
  }

  private filterItems(searchText: string, isChangeInternal = true): void {
    this.isChangeInternal = isChangeInternal;
    this.setHasSearchText(searchText);
    if (this.shouldDelegateSearchToEvent) {
      // Delegate filtering to the event.
      this.emitSearch();
    } else {
      // Default filtering.
      let groups = [];

      if (this.searchText === '') {
        groups = this.groups;
      } else {
        this.groups.forEach((group) => {
          const items = group.items.filter((item) => {
            const itemText = (this.itemTextField ? item[this.itemTextField] : item).toString().toLowerCase();
            return itemText.indexOf(this.searchText.trim().toLowerCase()) !== -1;
          });

          if (items.length) {
            groups.push({
              value: group.value,
              text: group.text,
              items: items
            });
          }
        });

        // No items found.
        if (!groups.length) {
          groups.push({
            items: []
          });
        }
      }

      this.filteredGroups = groups;
      this.hasFilteredItems = !this.areGroupsEmpty(groups);
      this.emitOnSearchSuccessOrFail(this.hasFilteredItems);
      this.selectableModalComponent?.update();
    }
  }

  private isItemValue(item: any): boolean {
    return this.generateText([this.valueItems], item, this.itemValueField) !== '';
  }

  private addSelectedItem(item: any): void {
    this.selectedItems.push(this.getItemValue(item));
    this.selectableModalComponent?.update();
  }

  private deleteSelectedItem(item: any) {
    let itemToDeleteIndex;

    this.selectedItems.forEach((selectedItem, itemIndex) => {
      if (
        this.generateText(this.selectedItems, item, this.itemValueField) ===
        this.generateText(this.selectedItems, selectedItem, this.itemValueField)
      ) {
        itemToDeleteIndex = itemIndex;
      }
    });
    this.selectedItems.splice(itemToDeleteIndex, 1);
    this.selectableModalComponent?.update();
  }

  private getItemValue(item: any): any {
    if (!this.hasObjects) {
      return item;
    }
    return this.shouldStoreItemValue ? item[this.itemValueField] : item;
  }

  private emitSelected(item: any, isSelected: boolean): void {
    this.selected.emit({
      component: this.element,
      value: item,
      isSelected: isSelected
    });
  }

  private emitChanged(): void {
    this.changed.emit({
      component: this.element,
      value: this.valueItems
    });
  }

  private emitOpened(): void {
    this.opened.emit({ component: this.element });
  }

  private emitClosed(): void {
    this.closed.emit({ component: this.element });
  }

  private emitCleared(): void {
    this.cleared.emit({ component: this.element, value: this.selectedItems });
  }

  private emitAddItem(): void {
    this.addItem.emit({ component: this.element });
  }

  private emitSearch(): void {
    this.search.emit({
      component: this.element,
      value: this.searchText
    });
  }

  private emitIonInfinite(): void {
    this.infiniteScroll.emit({
      component: this.element,
      value: this.searchText
    });
  }

  private emitOnSearchSuccessOrFail(isSuccess: boolean): void {
    const eventData: IIonicSelectableEvent = {
      component: this.element,
      value: this.searchText
    };

    if (isSuccess) {
      this.searchSuccessed.emit(eventData);
    } else {
      this.searchFailed.emit(eventData);
    }
  }

  private isNullOrWhiteSpace(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }

    // Convert value to string in case if it's not.
    return value.toString().replace(/\s/g, '').length < 1;
  }

  public setHasSearchText(searchText: string): void {
    this.hasSearchText = !this.isNullOrWhiteSpace(searchText);
    if (this.hasSearchText) {
      this.searchText = searchText.trim();
    } else {
      this.searchText = '';
    }
  }

  private countFooterButtons(): void {
    let footerButtonsCount = 0;

    if (this.canClear) {
      footerButtonsCount++;
    }

    if (this.isMultiple || this.hasConfirmButton) {
      footerButtonsCount++;
    }

    if (this.canAddItem) {
      footerButtonsCount++;
    }

    this.footerButtonsCount = footerButtonsCount;
    this.selectableModalComponent?.update();
  }

  private areGroupsEmpty(groups: any[]): boolean {
    return (
      groups.length === 0 ||
      groups.every((group) => {
        return !group.items || group.items.length === 0;
      })
    );
  }

  private getText(): string {
    const selectedText = this.selectedText;
    if (selectedText != null && selectedText !== '') {
      return selectedText;
    }
    return this.generateText(this.items, this.valueItems, this.itemTextField);
  }

  public getItemText(item: any): string {
    if (!this.hasObjects) {
      return item;
    }
    return this.shouldStoreItemValue ? item[this.itemTextField] : item;
  }

  private parseValue(): any {
    return JSON.stringify(this.valueItems);
  }

  private generateText(items: any[], value: any | any[], property: string): string {
    if (value === undefined || value === null) {
      return '';
    }
    let hasObjects = false;
    items.forEach((item) => {
      if (typeof item === 'object') {
        hasObjects = true;
      }
    });
    if (Array.isArray(value)) {
      return value
        .map((val) => {
          const key = typeof val === 'object' ? val[this.itemValueField] : val;
          if (hasObjects) {
            const findItem = items.find((item) => item[this.itemValueField] === key);
            if (findItem) {
              return property
                ? property.split('.').reduce((v, prop) => {
                    return v ? v[prop] : null;
                  }, findItem)
                : val.toString();
            } else {
              return '';
            }
          } else {
            const findItem = items.find((item) => item === key);
            return findItem ? findItem.toString() : '';
          }
        })
        .filter((opt) => opt !== null)
        .join(', ');
    } else {
      const key = typeof value === 'object' ? value[this.itemValueField] : value;
      if (hasObjects) {
        const findItem = items.find((item) => item[this.itemValueField] === key);
        if (findItem) {
          return property
            ? property.split('.').reduce((v, prop) => {
                return v ? v[prop] : null;
              }, findItem)
            : value.toString();
        } else {
          return '';
        }
      } else {
        const findItem = items.find((item) => item === key);
        return findItem ? findItem.toString() : '';
      }
    }
  }

  private async emitStyle(): Promise<void> {
    this.ionStyle.emit({
      interactive: true,
      'ionic-selectable': true,
      'has-placeholder': this.placeholder != null,
      'has-value': await this.hasValue(),
      'interactive-disabled': this.isDisabled,
      'ionic-selectable-is-disabled': this.isDisabled
    });
  }

  private whatchModalEvents(): void {
    this.modalElement.onDidDismiss().then((event) => {
      this.isOpened = false;
      this.setFocus();
      this.itemsToConfirm = [];

      // Closed by clicking on backdrop outside modal.
      if (event.role === 'backdrop') {
        this.closed.emit({
          component: this.element
        });
      }
    });
  }

  private setFocus(): void {
    if (this.buttonElement) {
      this.buttonElement.focus();
    }
  }

  private onClick = async (): Promise<void> => {
    this.setFocus();
    this.open();
  };

  private onFocus = (): void => {
    this.focused.emit();
  };

  private onBlur = (): void => {
    this.blurred.emit();
  };

  public render(): void {
    const { placeholder, name, isDisabled, isOpened, isMultiple, element } = this;
    const mode = getMode();
    // Add ripple efect
    if (mode === 'md') {
      addRippleEffectElement(element);
    }

    const item = findItem(element);
    if (item) {
      item.classList.add('ion-activatable');
      if (isOpened) {
        item.classList.add('item-has-focus');
      } else {
        item.classList.remove('item-has-focus');
      }
    }

    const labelId = this.id + '-lbl';
    let labelPosition = 'item-label-default';
    const label = findItemLabel(element);
    if (label) {
      label.id = labelId;
      labelPosition = `item-label-${label.getAttribute('position') ? label.getAttribute('position') : 'default'}`;
    }
    let addPlaceholderClass = false;
    let selectText = this.getText();
    if (selectText === '' && placeholder != null) {
      selectText = placeholder;
      addPlaceholderClass = true;
    }

    renderHiddenInput(true, element, name, this.parseValue(), isDisabled);

    const selectTextClasses: CssClassMap = {
      'ionic-selectable-text': true,
      'ionic-selectable-placeholder': addPlaceholderClass
    };

    const textPart = addPlaceholderClass ? 'placeholder' : 'text';

    return (
      <Host
        id={this.id}
        onClick={this.onClick}
        role="combobox"
        aria-haspopup="dialog"
        aria-disabled={isDisabled ? 'true' : null}
        aria-expanded={`${isOpened}`}
        aria-labelledby={labelId}
        class={{
          [mode]: true,
          'in-item': hostContext('ion-item', element),
          [labelPosition]: true,
          'item-multiple-inputs': isMultiple,
          'ionic-selectable-is-disabled': isDisabled
        }}
      >
        <div class={selectTextClasses} part={textPart}>
          {selectText}
        </div>
        <div class="ionic-selectable-icon" role="presentation" part="icon">
          <div class="ionic-selectable-icon-inner" part="icon-inner" />
        </div>
        <button
          type="button"
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          disabled={isDisabled}
          ref={(buttonElement) => (this.buttonElement = buttonElement)}
        />
      </Host>
    );
  }
}
let nextId = 0;