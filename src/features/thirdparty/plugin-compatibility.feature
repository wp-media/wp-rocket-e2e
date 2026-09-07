# Paid plugins (Elementor Pro, Advanced Custom Fields PRO) are intentionally left out of this
# list for now - they require manual provisioning and are tracked in a follow-up ticket.
@setup @smoke @plugin-compatibility
Feature: C397 - Third-party plugins should not cause a PHP fatal error alongside WP Rocket

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated

    Scenario Outline: Activating "<plugin>" should not write a PHP error to debug.log
        Given the "<plugin>" plugin is installed and activated
        When I go to ''
        And I go to 'wp-admin'
        Then I must not see any error in debug.log

        Examples:
            | plugin                     |
            | wordpress-seo              |
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
