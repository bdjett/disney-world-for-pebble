#include "common.h"

static Window *s_window;
static MenuLayer *s_menulayer_1;

static char *park_name;
static vector wait_times;
static TextLayer *text_layer;
static BitmapLayer *loading_icon_layer;

// Show loading screen
static void show_loading_icon(void) {
  Layer *window_layer = window_get_root_layer(s_window);

  GRect bounds = layer_get_frame(window_layer);

  loading_icon_layer = bitmap_layer_create(GRect(0, 0, bounds.size.w, bounds.size.h));
  bitmap_layer_set_background_color(loading_icon_layer, GColorBlack);
  layer_add_child(window_layer, bitmap_layer_get_layer(loading_icon_layer));

  text_layer = text_layer_create(GRect(0, 60, bounds.size.w, 30));
  text_layer_set_text_alignment(text_layer, GTextAlignmentCenter);
  text_layer_set_overflow_mode(text_layer, GTextOverflowModeWordWrap);
  text_layer_set_font(text_layer, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));
  text_layer_set_background_color(text_layer, GColorBlack);
  text_layer_set_text_color(text_layer, GColorWhite);
  text_layer_set_text(text_layer, "Loading...");
  layer_add_child(window_layer, text_layer_get_layer(text_layer));
}

// Hide loading screen
static void hide_loading_icon(void) {
  layer_remove_from_parent(text_layer_get_layer(text_layer));
  layer_remove_from_parent(bitmap_layer_get_layer(loading_icon_layer));
}

// Cancel all queued incoming app messages
static void cancel_app_messages() {
	DictionaryIterator *iter;
	app_message_outbox_begin(&iter);

	if (iter == NULL) {
		return;
	}

	dict_write_int16(iter, CANCEL_MESSAGES, 1);
	app_message_outbox_send();
}

// Ask JS to get wait times for the given park
static void get_wait_times(char *park) {
  DictionaryIterator *iter;
  app_message_outbox_begin(&iter);

  if (iter == NULL) {
    return;
  }

  dict_write_cstring(iter, GET_WAIT_TIMES, park);
  app_message_outbox_send();
}

// App message in received handler for wait times
void wait_times_in_received_handler(DictionaryIterator *iter) {
  hide_loading_icon();
  Tuple *wait_time_tuple = dict_find(iter, WAIT_TIME);
  Tuple *name_tuple = dict_find(iter, NAME);
  Tuple *index_tuple = dict_find(iter, INDEX);
  Tuple *id_tuple = dict_find(iter, ID);
  if (wait_time_tuple && name_tuple && index_tuple && id_tuple) {
    WaitTime *wait_time = (WaitTime *)malloc(sizeof(WaitTime));
    wait_time->index = index_tuple->value->int16;
    strncpy(wait_time->id, id_tuple->value->cstring, sizeof(wait_time->id));
    strncpy(wait_time->name, name_tuple->value->cstring, sizeof(wait_time->name));
    strncpy(wait_time->time, wait_time_tuple->value->cstring, sizeof(wait_time->time));
    if (wait_times.data != NULL) {
      vector_add(&wait_times, wait_time);
      layer_mark_dirty(menu_layer_get_layer(s_menulayer_1));
      menu_layer_reload_data(s_menulayer_1);
    }
  } else {
    // Got the last wait time, hide loading screen and reload menu layer

    //hide_loading_icon();
  }
}

// MENU CALLBACKS

static uint16_t menu_get_num_sections_callback(MenuLayer *menu_layer, void *data) {
  return 1;
}

static uint16_t menu_get_num_rows_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
  return wait_times.count;
}

static int16_t menu_get_header_height_callback(MenuLayer *layer, uint16_t section_index, void *data) {
  return MENU_CELL_BASIC_HEADER_HEIGHT;
}

static void menu_draw_header_callback(GContext *ctx, const Layer *cell_layer, uint16_t section_index, void *data) {
  menu_cell_basic_header_draw(ctx, cell_layer, park_name);
}

static void menu_draw_row_callback(GContext *ctx, const Layer *cell_layer, MenuIndex *cell_index, void *data) {
  menu_cell_basic_draw(ctx, cell_layer, ((WaitTime *)wait_times.data[cell_index->row])->name, ((WaitTime *)wait_times.data[cell_index->row])->time, NULL);
}

static void menu_select_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {
  show_attraction_info(((WaitTime *)wait_times.data[cell_index->row])->id);
}

// Free vector and reload data
static void clean_list(void) {
  vector_free(&wait_times);
	layer_mark_dirty(menu_layer_get_layer(s_menulayer_1));
  menu_layer_reload_data(s_menulayer_1);
}

// Initialize all UI components
static void initialise_ui(void) {
  s_window = window_create();

  vector_init(&wait_times);

  s_menulayer_1 = menu_layer_create(GRect(0, 0, 144, 152));
  menu_layer_set_callbacks(s_menulayer_1, NULL, (MenuLayerCallbacks) {
    .get_num_sections = menu_get_num_sections_callback,
    .get_num_rows = menu_get_num_rows_callback,
    .get_header_height = menu_get_header_height_callback,
    .draw_row = menu_draw_row_callback,
    .draw_header = menu_draw_header_callback,
    .select_click = menu_select_callback
  });
  menu_layer_set_click_config_onto_window(s_menulayer_1, s_window);
  layer_add_child(window_get_root_layer(s_window), (Layer *)s_menulayer_1);

  show_loading_icon();

  get_wait_times(park_name);
}

// Free memory from all UI components
static void destroy_ui(void) {
  window_destroy(s_window);
  menu_layer_destroy(s_menulayer_1);
  text_layer_destroy(text_layer);
  bitmap_layer_destroy(loading_icon_layer);
}

// Window unload callback
static void handle_window_unload(Window* window) {
  cancel_app_messages();
  clean_list();
  destroy_ui();
}

// Show window
void show_wait_times(char *park) {
  park_name = park;
  initialise_ui();
  window_set_window_handlers(s_window, (WindowHandlers) {
    .unload = handle_window_unload,
  });
  window_stack_push(s_window, true);
}

// Hide window
void hide_wait_times(void) {
  window_stack_remove(s_window, true);
}
