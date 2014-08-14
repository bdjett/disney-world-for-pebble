#pragma once

// IMPORTS
  
#include <pebble.h>
#include "pebble-assist.h"
#include "attraction.h"
#include "main_menu.h"
#include "wait_times.h"
#include "wait_times_select_park.h"
#include "entertainment_select_park.h"
#include "entertainment_list.h"
#include "schedule_times.h"
#include "itinerary_list.h"
#include "error.h"
#include "vector.h"
  
// TYPEDEFS
  
typedef struct {
  int index;
  char name[30];
  char time[30];
  char id[40];
} WaitTime;

typedef struct {
  int index;
  char time[30];
} EntertainmentTime;

typedef struct {
  int index;
  char name[50];
  char type[25];
  char time[50];
} ItineraryItem;

typedef struct {
    void **data;
    int size;
    int count;
} vector;

// APP MESSAGE KEYS

enum {
  INDEX = 0x0,
  NAME = 0x1,
  WAIT_TIME = 0x2,
  GET_WAIT_TIMES = 0x3,
  CANCEL_MESSAGES = 0x4,
  ID = 0x5,
  LOCATION = 0x6,
  DESCRIPTION = 0x7,
  GET_ATTRACTION_INFO = 0x8,
  GET_ENTERTAINMENT = 0x9,
  ENTERTAINMENT_STATUS = 10,
  GET_SCHEDULE = 11,
  SCHEDULE_TIME = 12,
  TYPE = 13,
  TIME = 14,
  GET_ITINERARY = 15,
  ERROR = 16
};

// VECTOR FUNCTIONS
 
void vector_init(vector*);
int vector_count(vector*);
void vector_add(vector*, void*);
void vector_free(vector*);