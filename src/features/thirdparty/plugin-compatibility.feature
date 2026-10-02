# Paid plugins (Elementor Pro, Advanced Custom Fields PRO, Rank Math SEO PRO) are intentionally
# left out of this list for now - they require manual provisioning and are tracked in a follow-up ticket.
# Imagify is also left out here: it already has a dedicated @imagify-compatibility suite with its
# own hooks and required API-key config, so it's tracked in the same follow-up rather than risking
# false positives from running it through this generic loop unconfigured.
@setup @smoke @plugin-compatibility
Feature: C397 - Third-party plugins should not cause a PHP fatal error alongside WP Rocket

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated

    Scenario Outline: Activating "<plugin>" should not write a PHP error to debug.log
        Given the "<plugin>" plugin is installed and activated
        When I visit '' and it must load successfully
        And I visit 'wp-admin' and it must load successfully
        And I visit 'wp-admin/plugins.php' and it must load successfully
        Then I must not see any error in debug.log

        Examples:
            | plugin                     |
            | wordpress-seo              |
            | classic-editor             |
            | elementor                  |
            | seo-by-rank-math           |
            | contact-form-7             |
            | google-site-kit            |
            | woocommerce                |
            | all-in-one-wp-migration    |
            | wordfence                  |
            | redirection                |
            | insert-headers-and-footers |
            | wp-mail-smtp               |
            | updraftplus                |
            | duplicate-page             |
            | akismet                    |
            | duplicate-post             |
