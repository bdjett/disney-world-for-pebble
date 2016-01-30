#include "common.h"

static Window *s_window;
static MenuLayer *s_menulayer_1;

static char *entertainment_id;
static char *entertainment_name;
static vector times;
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

// Cancel all queued incoming messages
static void cancel_app_messages() {
	DictionaryIterator *iter;
	app_message_outbox_begin(&iter);

	if (iter == NULL) {
		return;
	}

  dict_write_int16(iter, CANCEL_MESSAGES, 1);
  app_message_outbox_send();
}

// Ask JS to get schedule for given attraction ID
static void get_schedule(char *id) {
  DictionaryIterator *iter;
  app_message_outbox_begin(&iter);

  if (iter == NULL) {
    return;
  }

  dict_write_cstring(iter, GET_SCHEDULE, id);
  app_message_outbox_send();
}

// App message in recieved handler for schedule
void schedule_in_received_handler(DictionaryIterator *iter) {
  hide_loading_icon();
  Tuple *schedule_time_tuple = dict_find(iter, SCHEDULE_TIME);
  Tuple *index_tuple = dict_find(iter, INDEX);
  Tuple *name_tuple = dict_find(iter, NAME);
  if (index_tuple && schedule_time_tuple && name_tuple) {
    entertainment_name = name_tuple->value->cstring;
    EntertainmentTime *time = (EntertainmentTime *)malloc(sizeof(EntertainmentTime));
    strncpy(time->time, schedule_time_tuple->value->cstring, sizeof(time->time));
    time->index = index_tuple->value->int16;
    if (times.data != NULL) {
      vector_add(&times, time);
      layer_mark_dirty(menu_layer_get_layer(s_menulayer_1));
      menu_layer_reload_data(s_menulayer_1);
    }
  } else {

  }
}

// MENU CALLBACKS

static uint16_t menu_get_num_sections_callback(MenuLayer *menu_layer, void *data) {
  return 1;
}

static uint16_t menu_get_num_rows_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
  return times.count;
}

static int16_t menu_get_header_height_callback(MenuLayer *layer, uint16_t section_index, void *data) {
  return MENU_CELL_BASIC_HEADER_HEIGHT;
}

static int16_t menu_get_row_height_callback(MenuLayer *layer, MenuIndex *cell_index, void *data) {
  return 24;
}

static void menu_draw_header_callback(GContext *ctx, const Layer *cell_layer, uint16_t section_index, void *data) {
  menu_cell_basic_header_draw(ctx, cell_layer, entertainment_name);
}

static void menu_draw_row_callback(GContext *ctx, const Layer *cell_layer, MenuIndex *cell_index, void *data) {
  graphics_context_set_text_color(ctx, GColorBlack);
	graphics_draw_text(ctx, ((EntertainmentTime *)times.data[cell_index->row])->time, fonts_get_system_font(FONT_KEY_GOTHIC_18), GRect(3,0,layer_get_frame(cell_layer).size.w,layer_get_frame(cell_layer).size.h), GTextOverflowModeTrailingEllipsis, GTextAlignmentLeft, NULL);
}

static void menu_select_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {
  //show_attraction_info(wait_times[cell_index->row].id);
}

// Free vector and reload data
static void clean_list(void) {
  vector_free(&times);
  layer_mark_dirty(menu_layer_get_layer(s_menulayer_1));
  menu_layer_reload_data(s_menulayer_1);
}

// Initialize all UI components
static void initialise_ui(void) {
  s_window = window_create();

  vector_init(&times);
  entertainment_name = "";

  s_menulayer_1 = menu_layer_create(GRect(0, 0, 144, 152));
  menu_layer_set_callbacks(s_menulayer_1, NULL, (MenuLayerCallbacks) {
    .get_num_sections = menu_get_num_sections_callback,
    .get_num_rows = menu_get_num_rows_callback,
    .get_header_height = menu_get_header_height_callback,
    .get_cell_height = menu_get_row_height_callback,
    .draw_row = menu_draw_row_callback,
    .draw_header = menu_draw_header_callback,
    .select_click = menu_select_callback
  });
  menu_layer_set_click_config_onto_window(s_menulayer_1, s_window);
  layer_add_child(window_get_root_layer(s_window), (Layer *)s_menulayer_1);

  show_loading_icon();

  get_schedule(entertainment_id);
}

// Free all memory from UI components
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
void show_schedule(char *id) {
  entertainment_id = id;
  initialise_ui();
  window_set_window_handlers(s_window, (WindowHandlers) {
    .unload = handle_window_unload,
  });
  window_stack_push(s_window, true);
}

// Hide window
void hide_schedule(void) {
  window_stack_remove(s_window, true);
}
