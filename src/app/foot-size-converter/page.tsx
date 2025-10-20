"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Footprints, ArrowRightLeft, Info, User, Users } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Gender = 'men' | 'women' | 'kids';

// Comprehensive shoe size conversion tables
const shoeSizeData = {
  men: [
    { us: '6', uk: '5.5', eu: '38.5', cm: '24' },
    { us: '6.5', uk: '6', eu: '39', cm: '24.5' },
    { us: '7', uk: '6.5', eu: '40', cm: '25' },
    { us: '7.5', uk: '7', eu: '40.5', cm: '25.5' },
    { us: '8', uk: '7.5', eu: '41', cm: '26' },
    { us: '8.5', uk: '8', eu: '42', cm: '26.5' },
    { us: '9', uk: '8.5', eu: '42.5', cm: '27' },
    { us: '9.5', uk: '9', eu: '43', cm: '27.5' },
    { us: '10', uk: '9.5', eu: '44', cm: '28' },
    { us: '10.5', uk: '10', eu: '44.5', cm: '28.5' },
    { us: '11', uk: '10.5', eu: '45', cm: '29' },
    { us: '11.5', uk: '11', eu: '45.5', cm: '29.5' },
    { us: '12', uk: '11.5', eu: '46', cm: '30' },
    { us: '13', uk: '12.5', eu: '47.5', cm: '31' },
    { us: '14', uk: '13.5', eu: '49', cm: '32' },
  ],
  women: [
    { us: '5', uk: '2.5', eu: '35', cm: '21.5' },
    { us: '5.5', uk: '3', eu: '35.5', cm: '22' },
    { us: '6', uk: '3.5', eu: '36', cm: '22.5' },
    { us: '6.5', uk: '4', eu: '37', cm: '23' },
    { us: '7', uk: '4.5', eu: '37.5', cm: '23.5' },
    { us: '7.5', uk: '5', eu: '38', cm: '24' },
    { us: '8', uk: '5.5', eu: '38.5', cm: '24.5' },
    { us: '8.5', uk: '6', eu: '39', cm: '25' },
    { us: '9', uk: '6.5', eu: '40', cm: '25.5' },
    { us: '9.5', uk: '7', eu: '40.5', cm: '26' },
    { us: '10', uk: '7.5', eu: '41', cm: '26.5' },
    { us: '10.5', uk: '8', eu: '42', cm: '27' },
    { us: '11', uk: '8.5', eu: '42.5', cm: '27.5' },
    { us: '12', uk: '9.5', eu: '44', cm: '28.5' },
  ],
  kids: [
    { us: '10.5', uk: '10', eu: '27.5', cm: '16.5' },
    { us: '11', uk: '10.5', eu: '28', cm: '17' },
    { us: '11.5', uk: '11', eu: '29', cm: '17.5' },
    { us: '12', uk: '11.5', eu: '30', cm: '18' },
    { us: '12.5', uk: '12', eu: '30.5', cm: '18.5' },
    { us: '13', uk: '12.5', eu: '31', cm: '19' },
    { us: '13.5', uk: '13', eu: '31.5', cm: '19.5' },
    { us: '1', uk: '13.5', eu: '32', cm: '20' },
    { us: '1.5', uk: '1', eu: '33', cm: '20.5' },
    { us: '2', uk: '1.5', eu: '33.5', cm: '21' },
    { us: '2.5', uk: '2', eu: '34', cm: '21.5' },
    { us: '3', uk: '2.5', eu: '35', cm: '22' },
    { us: '3.5', uk: '3', eu: '35.5', cm: '22.5' },
    { us: '4', uk: '3.5', eu: '36', cm: '23' },
    { us: '4.5', uk: '4', eu: '36.5', cm: '23.5' },
    { us: '5', uk: '4.5', eu: '37', cm: '24' },
    { us: '5.5', uk: '5', eu: '37.5', cm: '24.5' },
    { us: '6', uk: '5.5', eu: '38', cm: '25' },
  ],
};

export default function FootSizeConverterPage() {
  const [gender, setGender] = useState<Gender>('men');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<'us' | 'uk' | 'eu' | 'cm'>('us');
  const [searchTerm, setSearchTerm] = useState('');

  const currentData = shoeSizeData[gender];

  const findConversions = () => {
    if (!selectedSize) return null;
    
    return currentData.find(row => {
      const value = row[selectedRegion];
      return value === selectedSize;
    });
  };

  const conversions = findConversions();

  const filteredData = currentData.filter(row => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(row).some(val => val.toLowerCase().includes(term));
  });

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 md:px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="lg:hidden" />
            <Footprints className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold font-headline">Shoe Size Converter</h1>
          </div>
          <ThemeToggleButton />
        </header>

        <div className="flex flex-1 flex-col p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">
                Shoe Size Converter & Reference
              </h1>
              <p className="text-lg text-muted-foreground">
                Convert shoe sizes between US, UK, EU, and CM measurements. Perfect for online shopping!
              </p>
            </div>

            <Tabs defaultValue="converter" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-auto">
                <TabsTrigger value="converter" className="text-sm sm:text-base py-3">
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Size Converter
                </TabsTrigger>
                <TabsTrigger value="reference" className="text-sm sm:text-base py-3">
                  <Info className="h-4 w-4 mr-2" />
                  Size Reference Chart
                </TabsTrigger>
              </TabsList>

              {/* Converter Tab */}
              <TabsContent value="converter" className="space-y-6">
                {/* Gender Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Select Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant={gender === 'men' ? 'default' : 'outline'}
                        onClick={() => {
                          setGender('men');
                          setSelectedSize('');
                        }}
                        className="h-16"
                      >
                        <div className="text-center">
                          <User className="h-5 w-5 mx-auto mb-1" />
                          <div className="text-xs sm:text-sm">Men</div>
                        </div>
                      </Button>
                      <Button
                        variant={gender === 'women' ? 'default' : 'outline'}
                        onClick={() => {
                          setGender('women');
                          setSelectedSize('');
                        }}
                        className="h-16"
                      >
                        <div className="text-center">
                          <User className="h-5 w-5 mx-auto mb-1" />
                          <div className="text-xs sm:text-sm">Women</div>
                        </div>
                      </Button>
                      <Button
                        variant={gender === 'kids' ? 'default' : 'outline'}
                        onClick={() => {
                          setGender('kids');
                          setSelectedSize('');
                        }}
                        className="h-16"
                      >
                        <div className="text-center">
                          <User className="h-5 w-5 mx-auto mb-1" />
                          <div className="text-xs sm:text-sm">Kids</div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Size Input */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Footprints className="h-5 w-5" />
                      Enter Your Size
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="region">Region/System</Label>
                        <Select value={selectedRegion} onValueChange={(value: any) => setSelectedRegion(value)}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us">US Size</SelectItem>
                            <SelectItem value="uk">UK Size</SelectItem>
                            <SelectItem value="eu">EU Size</SelectItem>
                            <SelectItem value="cm">CM (Length)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="size">Size</Label>
                        <Input
                          id="size"
                          type="text"
                          placeholder={`Enter ${selectedRegion.toUpperCase()} size`}
                          value={selectedSize}
                          onChange={(e) => setSelectedSize(e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>

                    {conversions && (
                      <div className="mt-6 p-6 bg-primary/10 border border-primary/20 rounded-lg">
                        <div className="text-center mb-4">
                          <Badge variant="secondary" className="text-base px-4 py-2">
                            {gender.charAt(0).toUpperCase() + gender.slice(1)}'s Size Conversions
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-background rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">US</div>
                            <div className="text-2xl font-bold text-primary">{conversions.us}</div>
                          </div>
                          <div className="text-center p-4 bg-background rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">UK</div>
                            <div className="text-2xl font-bold text-primary">{conversions.uk}</div>
                          </div>
                          <div className="text-center p-4 bg-background rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">EU</div>
                            <div className="text-2xl font-bold text-primary">{conversions.eu}</div>
                          </div>
                          <div className="text-center p-4 bg-background rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">CM</div>
                            <div className="text-2xl font-bold text-primary">{conversions.cm}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reference Chart Tab */}
              <TabsContent value="reference" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Size Reference Chart
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Gender Selection for Reference */}
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant={gender === 'men' ? 'default' : 'outline'}
                        onClick={() => setGender('men')}
                        size="sm"
                      >
                        Men
                      </Button>
                      <Button
                        variant={gender === 'women' ? 'default' : 'outline'}
                        onClick={() => setGender('women')}
                        size="sm"
                      >
                        Women
                      </Button>
                      <Button
                        variant={gender === 'kids' ? 'default' : 'outline'}
                        onClick={() => setGender('kids')}
                        size="sm"
                      >
                        Kids
                      </Button>
                    </div>

                    {/* Search */}
                    <div className="space-y-2">
                      <Label htmlFor="search">Search Sizes</Label>
                      <Input
                        id="search"
                        type="text"
                        placeholder="Search any size..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-10"
                      />
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-center font-bold">US</TableHead>
                              <TableHead className="text-center font-bold">UK</TableHead>
                              <TableHead className="text-center font-bold">EU</TableHead>
                              <TableHead className="text-center font-bold">CM</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredData.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-center font-medium">{row.us}</TableCell>
                                <TableCell className="text-center">{row.uk}</TableCell>
                                <TableCell className="text-center">{row.eu}</TableCell>
                                <TableCell className="text-center">{row.cm}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {filteredData.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No sizes match your search</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sizing Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Sizing Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>• <strong>Measure your feet in the afternoon</strong> - feet tend to swell throughout the day</p>
                    <p>• <strong>Measure while standing</strong> - your foot spreads when bearing weight</p>
                    <p>• <strong>Measure both feet</strong> - use the larger measurement if they differ</p>
                    <p>• <strong>Leave wiggle room</strong> - there should be about 1cm of space between your longest toe and the shoe end</p>
                    <p>• <strong>Consider the brand</strong> - sizes can vary between manufacturers</p>
                    <p>• <strong>Check width</strong> - these charts show standard width; some feet need wider or narrower sizes</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
