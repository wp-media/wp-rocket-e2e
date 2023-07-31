import type { Page } from "@playwright/test";
import { isElementEnabled, activateFromPopUp } from "../../utils/helpers";

export const selectors = {
    dashboard: {
        parent: "dashboard",
        elements: {
            target: "div[role=\"main\"] >> text=Clear and preload cache"
        }
    },
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
                     activateFromPopUp(page, state, "text=Activate minify CSS") 
                }
            },
            combineCss: {
                checkbox: "#minify_concatenate_css",
                target: "label[for=minify_concatenate_css]",
                before: async (page: Page): Promise<boolean> => { return isElementEnabled(page, "#minify_concatenate_css") },
                after: async (page: Page, state: boolean): Promise<void> => {
                    activateFromPopUp(page, state, "text=Activate combine CSS") 
               }
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
                after: async (page: Page, state: boolean): Promise<void> => {
                    activateFromPopUp(page, state, "Activate minify JavaScript") 
               }
            },
            combineJs: {
                checkbox: "#minify_concatenate_js",
                target: "label[for=minify_concatenate_js]",
                before: async (page: Page): Promise<boolean> => { return isElementEnabled(page, "#minify_concatenate_js") },
                after: async (page: Page, state: boolean): Promise<void> => {
                    activateFromPopUp(page, state, "Activate combine JavaScript") 
               }
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
                target: "label[for=lazyload_youtube]",
                before: async (page: Page): Promise<boolean> => {
                    return !await page.isHidden("#lazyload_youtube");
                },
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
                textbox: "#cache_reject_uri"
            },
            cacheRejectCookies: {
                textbox: "#cache_reject_cookies"
            },
            cacheRejectUa: {
                textbox: "#cache_reject_ua"
            },
            cachePurgePages: {
                textbox: "#cache_purge_pages"
            },
            cacheQueryStrings: {
                textbox: "#cache_query_strings"
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
    },
    heartbeat: {
        parent: "heartbeat",
        elements: {
            controlHeartbeat: {
                checkbox: "#control_heartbeat",
                target: "label[for=control_heartbeat]"
            }
        }
    },
    addons: {
        parent: "addons",
        elements: {
            varnishAutoPurge: {
                checkbox: "#varnish_auto_purge",
                target: "label[for=varnish_auto_purge]"
            },
            cacheWebp: {
                checkbox: "#cache_webp",
                target: "label[for=cache_webp]"
            },
            doCloudflare: {
                checkbox: "#do_cloudflare",
                target: "label[for=do_cloudflare]"
            },
            sucuryWafCacheSync: {
                checkbox: "#sucury_waf_cache_sync",
                target: "label[for=sucury_waf_cache_sync]"
            }
        }
    }
}