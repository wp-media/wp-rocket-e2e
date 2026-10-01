@smoke @local @setup @composer
Feature: C22268 - Should successfully install the plugin using composer (site-level Composer install under stable minimum-stability)

    Background:
        Given I am logged in

    Scenario Outline: Install WP Rocket with a site-level Composer install using <php>
        Given WP Rocket is not installed
        When I install WP Rocket with Composer using '<php>'
        Then Composer installed only stable packages
        When I activate WP Rocket from the plugins list
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        Then WP Rocket settings page is displayed
        And I must not see any error in debug.log

        Examples:
            | php    |
            | php7.4 |
            | php8.3 |
