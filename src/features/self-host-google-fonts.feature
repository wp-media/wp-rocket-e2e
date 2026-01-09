@smoke @selfhostgooglefonts @setup

Feature: Google Fonts are self-hosted

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'

    Scenario: Should apply host Google Fonts locally for v1 and v2
        Given I save settings 'media' 'selfHostGoogleFonts'
        And I log out
        And I visit the urls and check for self-hosted google fonts
        Then hosted Google Fonts parameters should match expected for all enabled entries

    Scenario: Should clear cache and used CSS when toggling Self-host GF with RUCSS on
        Given I disable settings 'preload' 'preload'
        And I save settings 'fileOptimization' 'rucss'
        When I log out
        And I go to 'gf_simple'
        And I go to 'combine_gf_v2new'
        Then data in folders is present
            | wp-content/cache/wp-rocket     |
            | wp-content/cache/used-css/1    |
        When I am logged in
        And I save settings 'media' 'selfHostGoogleFonts'
        Then data in folders is cleared out
            | wp-content/cache/wp-rocket     |
            | wp-content/cache/used-css/1    |
        When I log out
        And I go to 'gf_simple'
        And I go to 'combine_gf_v2new'
        Then data in folders is present
            | wp-content/cache/wp-rocket                |
            | wp-content/cache/used-css/1               |
            | wp-content/cache/fonts/1/google-fonts/css |
        When I am logged in
        And I disable settings 'media' 'selfHostGoogleFonts'
        Then data in folders is cleared out
            | wp-content/cache/wp-rocket                |
            | wp-content/cache/used-css/1               |
            | wp-content/cache/fonts/1/google-fonts/css |

    Scenario: Should clear cache/used CSS/fonts CSS with RUCSS off/on while toggling Self-host GF
        Given I disable settings 'preload' 'preload'
        And I save settings 'fileOptimization' 'rucss'
        When I log out
        And I go to 'gf_simple'
        And I go to 'combine_gf_v2new'
        Then data in folders is present
            | wp-content/cache/wp-rocket  |
            | wp-content/cache/used-css/1 |
        When I am logged in
        And I disable settings 'fileOptimization' 'rucss'
        And I save settings 'media' 'selfHostGoogleFonts'
        Then data in folders is cleared out
            | wp-content/cache/wp-rocket  |
            | wp-content/cache/used-css/1 |
        When I save settings 'fileOptimization' 'rucss'
        And I log out
        And I go to 'gf_simple'
        And I go to 'combine_gf_v2new'
        Then data in folders is present
            | wp-content/cache/wp-rocket                  |
            | wp-content/cache/used-css/1                 |
            | wp-content/cache/fonts/1/google-fonts/css   |
        When I am logged in
        And I disable settings 'fileOptimization' 'rucss'
        And I disable settings 'media' 'selfHostGoogleFonts'
        Then data in folders is cleared out
            | wp-content/cache/wp-rocket                  |
            | wp-content/cache/used-css/1                 |
            | wp-content/cache/fonts/1/google-fonts/css   |
        And data in folders is present
            | wp-content/cache/fonts/1/google-fonts/fonts |