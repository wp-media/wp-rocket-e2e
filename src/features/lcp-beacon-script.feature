@lcp @delaylcp @setup @priorityelements
Feature: Beacon script captures the right images.

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And plugin 'sitepress-multilingual-cms' is deactivated

  Scenario: Beacon captures expected images in desktop
    When I log out
    And I visit the urls for 'desktop'
    Then 'lcp and atf' should be as expected for 'desktop'

  Scenario: Beacon captures expected images in mobile
    Given I install plugin 'https://github.com/wp-media/wp-rocket-e2e-test-helper/raw/main/helper-plugin/force-wp-mobile.zip'
    And plugin 'force-wp-mobile' is activated
    When I log out
    And I visit the urls for 'mobile'
    And plugin 'force-wp-mobile' is deactivated
    Then 'lcp and atf' should be as expected for 'mobile'

  @long-test
  Scenario Outline: Beacon applied and no console errors in desktop for <url>
    Given I log out
    And I visit the url "<url>" for 'desktop'
    And I am logged in
    And I clear cache
    And I log out
    Then validate that url "<url>" in 'desktop' does not have console errors different than nowprocket

    Examples:
      | url                                |
      | lcp_bg_multimage_template          |
      | lcp_image_withspecialchar_template |
      | lcp_withfetchpriorityinurl_template|
      | lcp_picture_template2              |
      | lcp_section_template_relative      |
      | lcp_section_template2              |
      | lcp_bg_relative_attribute_incss    |
      | lcp_6599_template2                 |
      | lcp_picture_media_type_mixed       |
      | lcp_picture_relative               |
      | lcp_responsive_image               |
      | lcp_multiple_background_pseudo_bg_template |
      | lcp_pseudo_class_element           |
      | lcp_picture_template2_maxheight    |
      | lcp_picture_issue                  |
      | lcp_specialchar_template           |
      | lcp_specialchar2                   |
    
  

 