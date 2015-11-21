#include "common.h"

static Window *s_window;
static GBitmap *s_res_image_mickey_icon;
static GFont s_res_gothic_18_bold;
static GFont s_res_gothic_18;
static BitmapLayer *error_icon_bitmap_layer;
static TextLayer *error_title_text_layer;
static TextLayer *error_description_text_layer;

// Initialize all UI components
static void initialise_ui(void) {
  s_window = window_create();
  window_set_background_color(s_window, GColorBlack);

  s_res_image_mickey_icon = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_MICKEY_ICON);
  s_res_gothic_18_bold = fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD);
  s_res_gothic_18 = fonts_get_system_font(FONT_KEY_GOTHIC_18);
  // error_icon_bitmap_layer
  error_icon_bitmap_layer = bitmap_layer_create(GRect(60, 10, 24, 24));
  bitmap_layer_set_bitmap(error_icon_bitmap_layer, s_res_image_mickey_icon);
  layer_add_child(window_get_root_layer(s_window), (Layer *)error_icon_bitmap_layer);

  // error_title_text_layer
  error_title_text_layer = text_layer_create(GRect(5, 41, 134, 22));
  text_layer_set_background_color(error_title_text_layer, GColorClear);
  text_layer_set_text_color(error_title_text_layer, GColorWhite);
  text_layer_set_text_alignment(error_title_text_layer, GTextAlignmentCenter);
  text_layer_set_font(error_title_text_layer, s_res_gothic_18_bold);
  layer_add_child(window_get_root_layer(s_window), (Layer *)error_title_text_layer);

  // error_description_text_layer
  error_description_text_layer = text_layer_create(GRect(5, 65, 134, 81));
  text_layer_set_background_color(error_description_text_layer, GColorClear);
  text_layer_set_text_color(error_description_text_layer, GColorWhite);
  text_layer_set_text_alignment(error_description_text_layer, GTextAlignmentCenter);
  text_layer_set_font(error_description_text_layer, s_res_gothic_18);
  layer_add_child(window_get_root_layer(s_window), (Layer *)error_description_text_layer);
}

// Free all memory from UI components
static void destroy_ui(void) {
  window_destroy(s_window);
  bitmap_layer_destroy(error_icon_bitmap_layer);
  text_layer_destroy(error_title_text_layer);
  text_layer_destroy(error_description_text_layer);
  gbitmap_destroy(s_res_image_mickey_icon);
}

// Window unload callback
static void handle_window_unload(Window* window) {
  destroy_ui();
}

// Show window
void show_error(char *error_title, char *error_desc) {
  window_stack_pop(false);
  initialise_ui();
  text_layer_set_text(error_title_text_layer, error_title);
  text_layer_set_text(error_description_text_layer, error_desc);
  window_set_window_handlers(s_window, (WindowHandlers) {
    .unload = handle_window_unload,
  });
  window_stack_push(s_window, true);
  vibes_short_pulse();
}

// Hide window
void hide_error(void) {
  window_stack_remove(s_window, true);
}
