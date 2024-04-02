@llimg @setup
Feature: Check if content are lazyloaded while scrolling
  Background:
    Given I am logged in
    And plugin is installed 'new_release'
    And plugin is activated
    When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
    And I save settings 'media' 'lazyloadCssBgImg'
    And clear wpr cache

  Scenario: Open Lazy load css background images page
    When I log out
    And I go to 'lazyload_css_background_images' check initial image loaded
    Then I must see other 'lazyload_css_background_images' images

  Scenario: Open single colon template
    When I log out
    And I go to 'll_bg_css_single_colon' check initial image loaded
    Then Check 'll_bg_css_single_colon' input for background images

  Scenario: Open double colon template
    When I log out
    And I go to 'll_bg_css_double_colon' check initial image loaded
    Then Check 'll_bg_css_double_colon' inputs for background images
