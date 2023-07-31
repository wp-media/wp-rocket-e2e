import type { Page } from "@playwright/test";
import { isElementEnabled, activateFromPopUp } from "../../utils/helpers";
import type { Selectors } from "../../utils/types";

export const selectors: Selectors = {
    dashboard: {
        parent: "dashboard",
        elements: {
            clearCacheBtn: {
                button: {
                    target: "div[role=\"main\"] >> text=Clear and preload cache",
                }
            }
        }
    },
    cache: {
        parent: "cache",
        elements: {
            mobileDeviceCache: {
                checkbox: {
                    element: "#cache_mobile",
                    target: "label[for=cache_mobile]"
                }
            },
            mobileDeviceSeparateCache: {
                checkbox: {
                    element: "#do_caching_mobile_files",
                    target: "label[for=do_caching_mobile_files]"
                }
            },
            cacheLoggedUser: {
                checkbox: {
                    element: "#cache_logged_user",
                    target: "label[for=cache_logged_user]"
                }
            }
        }
    },
    fileOptimization: {
        parent: "file_optimization",
        elements: {
            minifyCss: {
                checkbox: {
                    element: "#minify_css",
                    target: "label[for=minify_css]",
                },
                after: async (page: Page, state: boolean): Promise<void> => {
                     activateFromPopUp(page, state, "text=Activate minify CSS") 
                }
            },
            combineCss: {
                checkbox: {
                    element: "#minify_concatenate_css",
                    target: "label[for=minify_concatenate_css]",
                },
                before: async (page: Page): Promise<boolean> => { return isElementEnabled(page, "#minify_concatenate_css") },
                after: async (page: Page, state: boolean): Promise<void> => {
                    activateFromPopUp(page, state, "text=Activate combine CSS") 
               }
            },
            rucss:{
                checkbox: {
                    element: "#optimize_css_delivery",
                    target: "label[for=optimize_css_delivery]",
                },
                after: async (page: Page): Promise<void> => {
                    if (await page.locator("text=Activate Remove Unused CSS").isHidden()) {
                        return;
                    }
            
                    await page.locator("text=Activate Remove Unused CSS").click();
                }
            },
            minifyJs: {
                checkbox: {
                    element: "#minify_js",
                    target: "label[for=minify_js]",
                },
                after: async (page: Page, state: boolean): Promise<void> => {
                    activateFromPopUp(page, state, "Activate minify JavaScript") 
               }
            },
            combineJs: {
                checkbox: {
                    element: "#minify_concatenate_js",
                    target: "label[for=minify_concatenate_js]",
                },
                before: async (page: Page): Promise<boolean> => { return isElementEnabled(page, "#minify_concatenate_js") },
                after: async (page: Page, state: boolean): Promise<void> => {
                    activateFromPopUp(page, state, "Activate combine JavaScript") 
               }
            },
            deferJs: {
                checkbox: {
                    element: "#defer_all_js",
                    target: "label[for=defer_all_js]"
                }
            },
            delayJs: {
                checkbox: {
                    element: "#delay_js",
                    target: "label[for=delay_js]"
                }
            }
        }
    },
    media: {
        parent: "media",
        elements: {
            lazyload: {
                checkbox: {
                    element: "#lazyload",
                    target: "label[for=lazyload]"
                }
            },
            lazyloadIframes: {
                checkbox: {
                    element: "#lazyload_iframes",
                    target: "label[for=lazyload_iframes]"
                }
            },
            lazyloadYoutube: {
                checkbox: {
                    element: "#lazyload_youtube",
                    target: "label[for=lazyload_youtube]"
                },
                before: async (page: Page): Promise<boolean> => {
                    return !await page.isHidden("#lazyload_youtube");
                },
            },
            imageDimensions: {
                checkbox: {
                    element: "#image_dimensions",
                    target: "label[for=image_dimensions]"
                }
            }
        }
    },
    preload: {
        parent: "preload",
        elements: {
            preload: {
                checkbox: {
                    element: "#manual_preload",
                    target: "label[for=manual_preload]"
                }
            },
            preloadLinks: {
                checkbox: {
                    element: "#preload_links",
                    target: "label[for=preload_links]"
                }
            }
        }
    },
    advancedRules: {
        parent: "advanced_cache",
        elements: {
            cacheRejectUri: {
                textbox: {
                    element: "#cache_reject_uri"
                }
            },
            cacheRejectCookies: {
                textbox: {
                    element: "#cache_reject_cookies"
                }
            },
            cacheRejectUa: {
                textbox: {
                    element: "#cache_reject_ua"
                }
            },
            cachePurgePages: {
                textbox: {
                    element: "#cache_purge_pages"
                }
            },
            cacheQueryStrings: {
                textbox: {
                    element: "#cache_query_strings"
                }
            },
        }
    },
    database: {
        parent: "database",
        elements: {
            databaseRevisions: {
                checkbox: {
                    element: "#database_revisions",
                    target: "label[for=database_revisions]"
                }
            },
            databaseAutoDrafts: {
                checkbox: {
                    element: "#database_auto_drafts",
                    target: "label[for=database_auto_drafts]"
                }
            },
            databaseTrashedPosts: {
                checkbox: {
                    element: "#database_trashed_posts",
                    target: "label[for=database_trashed_posts]"
                }
            },
            databaseSpamComments: {
                checkbox: {
                    element: "#database_spam_comments",
                    target: "label[for=database_spam_comments]"
                }
            },
            databaseTrashedComments: {
                checkbox: {
                    element: "#database_trashed_comments",
                    target: "label[for=database_trashed_comments]"
                }
            },
            databaseAllTransients: {
                checkbox: {
                    element: "#database_all_transients",
                    target: "label[for=database_all_transients]"
                }
            },
            databaseOptimizeTables: {
                checkbox: {
                    element: "#database_optimize_tables",
                    target: "label[for=database_optimize_tables]"
                }
            },
            scheduleAutomaticCleanup: {
                checkbox: {
                    element: "#schedule_automatic_cleanup",
                    target: "label[for=schedule_automatic_cleanup]"
                }
            }
        }
    },
    cdn: {
        parent: "page_cdn",
        elements: {
            cdn: {
                checkbox: {
                    element: "#cdn",
                    target: "label[for=cdn]"
                }
            },
            cnames: {
                role: {
                    name: "textbox",
                    roleTarget: { name: "cdn.example.com" }
                }
            }
        }
    },
    heartbeat: {
        parent: "heartbeat",
        elements: {
            controlHeartbeat: {
                checkbox: {
                    element: "#control_heartbeat",
                    target: "label[for=control_heartbeat]"
                }
            }
        }
    },
    addons: {
        parent: "addons",
        elements: {
            varnishAutoPurge: {
                checkbox: {
                    element: "#varnish_auto_purge",
                    target: "label[for=varnish_auto_purge]"
                }
            },
            cacheWebp: {
                checkbox: {
                    element: "#cache_webp",
                    target: "label[for=cache_webp]"
                }
            },
            doCloudflare: {
                checkbox: {
                    element: "#do_cloudflare",
                    target: "label[for=do_cloudflare]"
                }
            },
            sucuryWafCacheSync: {
                checkbox: {
                    element: "#sucury_waf_cache_sync",
                    target: "label[for=sucury_waf_cache_sync]"
                }
            }
        }
    }
}