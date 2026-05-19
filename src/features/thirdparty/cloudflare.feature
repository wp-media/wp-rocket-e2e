@setup @cloudflare-compatibility
Feature: Cloudflare 3rd party compatibility with WP Rocket

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated

    Scenario: Shouldnot cause console error when clear cache while CF plugin is set
        Given I install plugin 'cloudflare'
        And plugin cloudflare is activated
        And Cloudflare is set up
        And clear wpr cache
        Then I must not see any error in debug.log