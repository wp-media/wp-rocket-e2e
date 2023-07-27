import type { Page } from "@playwright/test";

export const selectors = {
    cache: {
        parent: "cache",
        elements: {
            mobileDeviceCache: {
                checkbox: "#cache_mobile",
                target: "label[for=cache_mobile]"
            },
            mobileDeviceSeparateCache: {
                checkbox: "#do_caching_mobile_files",
                target: "label[for=do_caching_mobile_files]"
            },
            cacheLoggedUser: {
                checkbox: "#cache_logged_user",
                target: "label[for=cache_logged_user]"
            }
        }
    },
    fileOptimization: {
        parent: "file_optimization",
        elements: {
            minifyCss: {
                checkbox: "#minify_css",
                target: "label[for=minify_css]",
                after: async (page: Page, state: boolean): Promise<void> => {
                    if (!state) {
                        return;
                    }

                    await page.waitForSelector("text=Activate minify CSS");
                    await page.locator("text=Activate minify CSS").click();
                }
            },
            combineCss: {
                checkbox: "#minify_concatenate_css",
                target: "label[for=minify_concatenate_css]",
                activate: "text=Activate combine CSS"
            },
            rucss:{
                checkbox: "#optimize_css_delivery",
                target: "label[for=optimize_css_delivery]",
                after: async (page: Page): Promise<void> => {
                    if (await page.locator("text=Activate Remove Unused CSS").isHidden()) {
                        return;
                    }
            
                    await page.locator("text=Activate Remove Unused CSS").click();
                }
            },
            minifyJs: {
                checkbox: "#minify_js",
                target: "label[for=minify_js]",
                activate: "text=Activate minify JavaScript"
            },
            combineJs: {
                checkbox: "#minify_concatenate_js",
                target: "label[for=minify_concatenate_js]",
                activate: "text=Activate combine JavaScript"
            },
            deferJs: {
                checkbox: "#defer_all_js",
                target: "label[for=defer_all_js]"
            },
            delayJs: {
                checkbox: "#delay_js",
                target: "label[for=delay_js]"
            }
        }
    },
    media: {
        parent: "media",
        elements: {
            lazyload: {
                checkbox: "#lazyload",
                target: "label[for=lazyload]"
            },
            lazyloadIframes: {
                checkbox: "#lazyload_iframes",
                target: "label[for=lazyload_iframes]"
            },
            lazyloadYoutube: {
                checkbox: "#lazyload_youtube",
                target: "label[for=lazyload_youtube]"
            },
            imageDimensions: {
                checkbox: "#image_dimensions",
                target: "label[for=image_dimensions]"
            }
        }
    },
    preload: {
        parent: "preload",
        elements: {
            preload: {
                checkbox: "#manual_preload",
                target: "label[for=manual_preload]"
            },
            preloadLinks: {
                checkbox: "#preload_links",
                target: "label[for=preload_links]"
            }
        }
    },
    advancedRules: {
        parent: "advanced_cache",
        elements: {
            cacheRejectUri: {
                target: "cache_reject_uri"
            },
            cacheRejectCookies: {
                target: "cache_reject_cookies"
            },
            cacheRejectUa: {
                target: "cache_reject_ua"
            },
            cachePurgePages: {
                target: "cache_purge_pages"
            },
            cacheQueryStrings: {
                target: "cache_query_strings"
            },
        }
    },
    database: {
        parent: "database",
        elements: {
            databaseRevisions: {
                checkbox: "#database_revisions",
                target: "label[for=database_revisions]"
            },
            databaseAutoDrafts: {
                checkbox: "#database_auto_drafts",
                target: "label[for=database_auto_drafts]"
            },
            databaseTrashedPosts: {
                checkbox: "#database_trashed_posts",
                target: "label[for=database_trashed_posts]"
            },
            databaseSpamComments: {
                checkbox: "#database_spam_comments",
                target: "label[for=database_spam_comments]"
            },
            databaseTrashedComments: {
                checkbox: "#database_trashed_comments",
                target: "label[for=database_trashed_comments]"
            },
            databaseAllTransients: {
                checkbox: "#database_all_transients",
                target: "label[for=database_all_transients]"
            },
            databaseOptimizeTables: {
                checkbox: "#database_optimize_tables",
                target: "label[for=database_optimize_tables]"
            },
            scheduleAutomaticCleanup: {
                checkbox: "#schedule_automatic_cleanup",
                target: "label[for=schedule_automatic_cleanup]"
            }
        }
    },
    cdn: {
        parent: "page_cdn",
        elements: {
            cdn: {
                checkbox: "#cdn",
                target: "label[for=cdn]"
            },
            cnames: {
                role: "textbox",
                roleTarget: { 
                    name: "cdn.example.com" 
                }
            }
        }
    }
}