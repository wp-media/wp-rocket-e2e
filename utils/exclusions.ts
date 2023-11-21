/**
 * @fileoverview
 * This module exports arrays representing UI-reflected settings and a diff checker.
 * It includes settings related to performance optimization, caching, database cleanup, and various features.
 */

/**
 * Array representing UI-reflected settings for performance optimization and feature toggles.
 *
 * @type {string[]}
 * @constant
 */
export const uiReflectedSettings = [
    'lazyload',
    'remove_unused_css',
    'async_css',
    'cache_logged_user',
    'cache_mobile',
    'do_caching_mobile_files',
    'minify_css',
    'minify_js',
    'minify_concatenate_js',
    'defer_all_js',
    'lazyload_iframes',
    'lazyload_youtube',
    'database_revisions',
    'database_auto_drafts',
    'database_trashed_posts',
    'database_spam_comments',
    'database_trashed_comments',
    'database_all_transients',
    'database_optimize_tables',
    'schedule_automatic_cleanup',
    'manual_preload',
    'do_cloudflare',
    'sucury_waf_cache_sync',
    'control_heartbeat',
    'cdn',
    'varnish_auto_purge',
    'image_dimensions',
    'delay_js', 
];

/**
 * Array representing settings used for diff checking.
 *
 * @type {string[]}
 * @constant
 */
export const diffChecker = [
    "version",
    "delay_js",
    "minify_concatenate_css",
    "delay_js_exclusions_selected",
    "delay_js_exclusions_selected_exclusions",
    "license",
    "secret_cache_key",
    "minify_css_key",
    "minify_js_key",
    "version",
];