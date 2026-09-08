@delayjs @setup 
Feature: No Regression with delayjs script update

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        

    Scenario Outline: Shouldnot cause console error when enabling Delay JS with theme <theme> for desktop
        Given theme "<theme>" is activated via WP-CLI
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I save settings 'fileOptimization' 'delayJs'
        And one click exclusions are enabled if exists
        Then I must not see any error in debug.log
        When I log out
        Then no error nor warning in the console different than nowprocket page ''

        Examples:
            | theme                  |
            | Divi                   |
            | astra                  |
            | flatsome               |
            | storefront             |
            | hello-elementor        |
            | neve                   |
            | kadence                |
            | generatepress          |
            | genesis-sample         |
            | oceanwp                |
            | Avada                  |
            | blocksy                |
            | twentytwentyfive       |
            | twentytwentyfour       |
            | betheme                |
            | Total                  |
            | Newspaper              |
            | woodmart               |
            | bb-theme               |

  
    Scenario Outline: Shouldnot cause console error when open mobile menu and click link works
        Given theme "<theme>" is activated via WP-CLI
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I save settings 'fileOptimization' 'delayJs'
        And one click exclusions are enabled if exists
        When I log out
        Then expand mobile menu and validate no console error nor warning
        And I click on link
        Then page navigated to the new page 'about-us'

        Examples:
            | theme                  |
            | neve                   |
            | Divi                   |
            | flatsome               |
            | kadence                |
            | storefront             |
            | astra                  |
            | generatepress          |
            | oceanwp                |
            | Avada                  |
